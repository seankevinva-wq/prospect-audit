#!/usr/bin/env node
/**
 * Capture screenshot, logo, and brand colors for a prospect's website.
 * Uploads to Supabase Storage (prospect-assets/{slug}/), updates prospects table.
 *
 * Usage:
 *   node scripts/capture-assets.js --slug st-pauls-dental
 *   node scripts/capture-assets.js --id <uuid>
 *
 * Prints JSON to stdout: { screenshot_url, logo_url, brand_accent, brand_dark }
 */

'use strict'

const fs   = require('fs')
const path = require('path')
const { chromium } = require('/home/kevin/sean/node_modules/playwright')

// ── Env loader ────────────────────────────────────────────────────────────────

function loadEnv(p = '/home/kevin/sean/.env') {
  const env = {}
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const idx = trimmed.indexOf('=')
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim()
  }
  return env
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function sbFetch(url, opts = {}) {
  const res = await fetch(url, opts)
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

async function getProspect(ENV, { slug, id }) {
  const filter = slug ? `slug=eq.${encodeURIComponent(slug)}` : `id=eq.${id}`
  const res = await sbFetch(
    `${ENV.SUPABASE_URL}/rest/v1/prospects?${filter}&select=id,business_name,website,slug&limit=1`,
    { headers: { apikey: ENV.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}` } }
  )
  return Array.isArray(res) ? res[0] : null
}

async function uploadFile(ENV, storageKey, localPath, filename, contentType) {
  const storagePath = `${storageKey}/${filename}`
  const data = fs.readFileSync(localPath)
  const res = await sbFetch(
    `${ENV.SUPABASE_URL}/storage/v1/object/prospect-assets/${storagePath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: data,
    }
  )
  if (res.Key || res.Id || (typeof res === 'string' && res.includes(storagePath))) {
    return `${ENV.SUPABASE_URL}/storage/v1/object/public/prospect-assets/${storagePath}`
  }
  throw new Error(`Upload failed: ${JSON.stringify(res)}`)
}

async function updateProspect(ENV, id, updates) {
  await sbFetch(
    `${ENV.SUPABASE_URL}/rest/v1/prospects?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: ENV.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(updates),
    }
  )
}

// ── Asset capture ─────────────────────────────────────────────────────────────

async function capturePageAssets(website, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  })
  const page = await context.newPage()

  let screenshotPath = null
  let logoPath = null
  let brandAccent = null
  let brandDark = null

  try {
    console.error('Navigating to', website)
    await page.goto(website, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(1200)

    // 1. Viewport screenshot (above-the-fold)
    screenshotPath = path.join(outputDir, 'screenshot.png')
    await page.screenshot({ path: screenshotPath })
    const ssSize = fs.statSync(screenshotPath).size
    console.error(`Screenshot saved (${(ssSize / 1024).toFixed(0)} KB)`)

    // 2. Logo capture — try selectors in priority order
    const logoSelectors = [
      'header img[alt*="logo" i]',
      'nav img[alt*="logo" i]',
      '[class*="logo" i] img',
      '[id*="logo" i] img',
      'header a:first-child img',
      'nav a:first-child img',
    ]
    let logoEl = null
    for (const sel of logoSelectors) {
      try {
        logoEl = await page.$(sel)
        if (logoEl) { console.error(`Logo found: ${sel}`); break }
      } catch {}
    }
    if (logoEl) {
      const tmpLogo = path.join(outputDir, 'logo.png')
      await logoEl.screenshot({ path: tmpLogo })
      const logoSize = fs.statSync(tmpLogo).size
      if (logoSize > 500) {
        logoPath = tmpLogo
        console.error(`Logo saved (${(logoSize / 1024).toFixed(0)} KB)`)
      } else {
        console.error('Logo screenshot too small, skipping')
      }
    } else {
      console.error('No logo element found')
    }

    // 3. Brand colors from computed styles
    const colors = await page.evaluate(() => {
      function rgbToHex(rgb) {
        const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (!m) return null
        const [, r, g, b] = m.map(Number)
        // Skip pure black, pure white, or transparent
        if (r === 0 && g === 0 && b === 0) return null
        if (r > 240 && g > 240 && b > 240) return null
        return [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      }
      function lum(rgb) {
        const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (!m) return 128
        const [, r, g, b] = m.map(Number)
        return 0.299 * r + 0.587 * g + 0.114 * b
      }

      let accent = null, dark = null

      // Dark color: nav/header background
      for (const sel of ['header', 'nav', '[class*="navbar" i]', '[class*="header" i]', 'body']) {
        const el = document.querySelector(sel)
        if (!el) continue
        const bg = getComputedStyle(el).backgroundColor
        if (lum(bg) < 80) { dark = rgbToHex(bg); if (dark) break }
      }

      // Accent: primary CTA buttons
      const ctaSelectors = [
        'a[class*="btn-primary" i]', 'button[class*="btn-primary" i]',
        '.btn-primary', '.button-primary',
        'a[class*="cta" i]', 'button[class*="cta" i]',
        'a[class*="book" i]', 'a[class*="contact" i]',
        '.btn', 'button[type="submit"]',
      ]
      for (const sel of ctaSelectors) {
        const el = document.querySelector(sel)
        if (!el) continue
        const bg = getComputedStyle(el).backgroundColor
        const l = lum(bg)
        if (l > 20 && l < 230) { accent = rgbToHex(bg); if (accent) break }
      }

      return { accent, dark }
    })

    brandAccent = colors.accent
    brandDark = colors.dark
    console.error(`Brand colors — accent: #${brandAccent || 'none'}, dark: #${brandDark || 'none'}`)

  } catch (err) {
    console.error('Capture error (non-fatal):', err.message)
  }

  await context.close()
  await browser.close()

  return { screenshotPath, logoPath, brandAccent, brandDark }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const slugIdx = args.indexOf('--slug')
  const idIdx   = args.indexOf('--id')
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : null
  const id   = idIdx   !== -1 ? args[idIdx   + 1] : null

  if (!slug && !id) {
    console.error('Usage: node scripts/capture-assets.js --slug <slug>')
    console.error('   or: node scripts/capture-assets.js --id <uuid>')
    process.exit(1)
  }

  const ENV = loadEnv()

  console.error('Fetching prospect...')
  const prospect = await getProspect(ENV, { slug, id })
  if (!prospect) { console.error('Prospect not found'); process.exit(1) }
  if (!prospect.website) { console.error('No website on prospect'); process.exit(1) }

  const storageKey = prospect.slug || prospect.id
  console.error(`Capturing: ${prospect.business_name} — ${prospect.website}`)

  const outputDir = `/tmp/prospect-assets/${storageKey}`
  const { screenshotPath, logoPath, brandAccent, brandDark } = await capturePageAssets(prospect.website, outputDir)

  const updates = {}

  if (screenshotPath && fs.existsSync(screenshotPath)) {
    console.error('Uploading screenshot...')
    updates.screenshot_url = await uploadFile(ENV, storageKey, screenshotPath, 'screenshot.png', 'image/png')
    console.error('Screenshot URL:', updates.screenshot_url)
  }

  if (logoPath && fs.existsSync(logoPath)) {
    console.error('Uploading logo...')
    updates.logo_url = await uploadFile(ENV, storageKey, logoPath, 'logo.png', 'image/png')
    console.error('Logo URL:', updates.logo_url)
  }

  if (brandAccent) updates.brand_accent = brandAccent
  if (brandDark)   updates.brand_dark   = brandDark

  if (Object.keys(updates).length > 0) {
    await updateProspect(ENV, prospect.id, updates)
    console.error('Updated prospect record.')
  }

  process.stdout.write(JSON.stringify(updates) + '\n')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
