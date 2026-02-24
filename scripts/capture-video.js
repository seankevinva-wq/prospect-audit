#!/usr/bin/env node
/**
 * Capture a 10-second looping Playwright walkthrough of a prospect's website.
 * Records: page load → slow scroll → click a nav link → scroll back to top.
 * Saves WebM to Supabase Storage, updates prospects.video_url.
 *
 * Usage:
 *   node scripts/capture-video.js --slug st-pauls-dental
 *   node scripts/capture-video.js --id 643e1900-6dd2-4652-946d-07d7c9706c15
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

// ── Supabase helpers (raw fetch, no SDK needed) ───────────────────────────────

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

async function uploadVideo(ENV, slug, localPath) {
  const storagePath = `${slug}/walkthrough.webm`
  const data = fs.readFileSync(localPath)
  const res = await sbFetch(
    `${ENV.SUPABASE_URL}/storage/v1/object/prospect-assets/${storagePath}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'video/webm',
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

async function updateProspect(ENV, id, videoUrl) {
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
      body: JSON.stringify({ video_url: videoUrl }),
    }
  )
}

// ── Playwright recording ──────────────────────────────────────────────────────

async function recordWalkthrough(website, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: outputDir, size: { width: 1280, height: 720 } },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  })

  const page = await context.newPage()

  try {
    console.error('Navigating to', website)
    await page.goto(website, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(1200) // settle on landing

    // Slow scroll down — 3 seconds, smooth
    console.error('Scrolling...')
    await page.evaluate(async () => {
      await new Promise(resolve => {
        const maxScroll = Math.min(document.body.scrollHeight - window.innerHeight, 2000)
        const steps = 60
        const stepSize = maxScroll / steps
        let current = 0
        const t = setInterval(() => {
          current += stepSize
          window.scrollTo(0, current)
          if (current >= maxScroll) { clearInterval(t); resolve(undefined) }
        }, 50) // 50ms × 60 = 3s
      })
    })
    await page.waitForTimeout(600)

    // Try clicking an internal nav link
    console.error('Clicking nav...')
    const clicked = await page.evaluate(async () => {
      const candidates = Array.from(document.querySelectorAll('nav a, header a, [class*="nav"] a'))
      for (const a of candidates) {
        const href = a.href
        if (!href) continue
        try {
          const u = new URL(href)
          if (u.hostname === location.hostname && u.pathname !== '/' && u.pathname !== location.pathname) {
            a.click()
            return u.pathname
          }
        } catch (_) {}
      }
      return null
    })
    if (clicked) {
      console.error('Clicked nav link:', clicked)
      await page.waitForTimeout(1800)
    } else {
      await page.waitForTimeout(600)
    }

    // Scroll back to top smoothly
    console.error('Scrolling back to top...')
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    await page.waitForTimeout(1500)

  } catch (err) {
    console.error('Recording error (non-fatal):', err.message)
  }

  // Save video — must get path before context closes
  const videoPathPromise = page.video()?.path()
  await context.close()
  await browser.close()

  const videoPath = await videoPathPromise
  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error('Video file not found after recording')
  }

  const stat = fs.statSync(videoPath)
  console.error(`Video saved: ${videoPath} (${(stat.size / 1024).toFixed(0)} KB)`)
  return videoPath
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const slugIdx = args.indexOf('--slug')
  const idIdx   = args.indexOf('--id')
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : null
  const id   = idIdx   !== -1 ? args[idIdx   + 1] : null

  if (!slug && !id) {
    console.error('Usage: node scripts/capture-video.js --slug <slug>')
    console.error('   or: node scripts/capture-video.js --id <uuid>')
    process.exit(1)
  }

  const ENV = loadEnv()

  // Get prospect
  console.error('Fetching prospect...')
  const prospect = await getProspect(ENV, { slug, id })
  if (!prospect) { console.error('Prospect not found'); process.exit(1) }
  if (!prospect.website) { console.error('No website on prospect'); process.exit(1) }

  console.error(`Recording: ${prospect.business_name} — ${prospect.website}`)

  const outputDir = `/tmp/prospect-videos/${prospect.slug || prospect.id}`
  const videoPath = await recordWalkthrough(prospect.website, outputDir)

  // Upload
  console.error('Uploading to Supabase Storage...')
  const videoUrl = await uploadVideo(ENV, prospect.slug || prospect.id, videoPath)
  console.error('Uploaded:', videoUrl)

  // Update DB
  await updateProspect(ENV, prospect.id, videoUrl)
  console.error('Updated prospect record.')

  // Output URL for piping
  process.stdout.write(videoUrl + '\n')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
