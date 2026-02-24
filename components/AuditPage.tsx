'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { Prospect, ParsedContent, Win, Metric } from '@/lib/types'
import { extractBaseValue } from '@/lib/parseContent'

interface Props {
  prospect: Prospect
  parsed: ParsedContent
}

function hex(color: string | null, fallback: string) {
  return color ? `#${color}` : fallback
}

function formatEuro(n: number) {
  return '€' + n.toLocaleString('en-IE')
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function StickyNav({ businessName, logoUrl, accent, dark }: {
  businessName: string
  logoUrl: string | null
  accent: string
  dark: string
}) {
  const links = [
    { href: '#overview', label: 'Overview' },
    { href: '#reviews', label: 'Reviews' },
    { href: '#wins', label: 'Wins' },
    { href: '#roi', label: 'ROI' },
  ]

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/10"
      style={{ background: dark }}
    >
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl && (
            <div className="bg-white rounded-lg p-1.5 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="h-6 w-auto object-contain" style={{ maxWidth: 80 }} />
            </div>
          )}
          <span className="text-white/80 text-sm font-medium truncate hidden sm:block">
            {businessName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="mailto:kevinfar@gmail.com?subject=Re: Automation Opportunity"
            className="ml-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90 flex-shrink-0"
            style={{ background: accent, color: dark }}
          >
            Book a call
          </a>
        </div>
      </div>
    </nav>
  )
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero({ prospect, accent, dark }: { prospect: Prospect; accent: string; dark: string }) {
  return (
    <header className="py-14" style={{ background: `linear-gradient(160deg, ${dark} 0%, ${dark}f0 100%)` }}>
      <div className="max-w-4xl mx-auto px-6 flex items-center justify-between gap-8">
        <div>
          <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: accent }}>
            Automation Opportunity Brief
          </p>
          <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight mb-3">
            {prospect.business_name}
          </h1>
          <p className="text-white/40 text-sm mb-5">
            Prepared by Kevin Farrell &nbsp;·&nbsp; kevinfar@gmail.com
          </p>
          <div className="flex flex-wrap gap-2">
            {prospect.google_rating && (
              <Badge className="text-xs px-2.5 py-1 font-medium border"
                style={{ background: `${accent}25`, color: accent, borderColor: `${accent}40` }}>
                ⭐ {prospect.google_rating} Google rating
              </Badge>
            )}
            {prospect.review_count && (
              <Badge className="text-xs px-2.5 py-1 font-medium border"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)' }}>
                {prospect.review_count} reviews
              </Badge>
            )}
            {prospect.city && (
              <Badge className="text-xs px-2.5 py-1 font-medium border"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)' }}>
                📍 {prospect.city}
              </Badge>
            )}
          </div>
        </div>
        {prospect.logo_url && (
          <div className="flex-shrink-0 hidden sm:block">
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prospect.logo_url}
                alt={prospect.business_name}
                className="h-16 w-auto object-contain"
                style={{ maxWidth: 160 }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ id, title, accent, children }: {
  id: string
  title: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="py-12 scroll-mt-14">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
            {title}
          </h2>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        {children}
      </div>
    </section>
  )
}

// ── Observation card ──────────────────────────────────────────────────────────

function ObservationCard({ text, accent }: { text: string; accent: string }) {
  return (
    <div
      className="rounded-xl p-4 bg-gray-50 text-gray-700 text-sm leading-relaxed"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {text}
    </div>
  )
}

// ── Flow diagram ──────────────────────────────────────────────────────────────

function FlowDiagram({ flow, accent, dark }: { flow: string; accent: string; dark: string }) {
  const parts = flow.split('|').map(s => s.trim()).filter(Boolean)
  if (parts.length < 2) return null
  return (
    <div className="flex items-stretch gap-1 my-4">
      {parts.map((step, i) => (
        <div key={i} className="flex items-center gap-1 flex-1 min-w-0">
          <div
            className="flex-1 rounded-lg px-3 py-3 text-center min-w-0"
            style={{ background: i === 1 ? accent : dark }}
          >
            <div className="text-xs font-bold mb-1" style={{ color: i === 1 ? dark : accent }}>
              {i + 1}
            </div>
            <div className="text-white text-xs leading-tight">{step}</div>
          </div>
          {i < parts.length - 1 && (
            <span className="text-gray-300 text-sm font-bold flex-shrink-0">›</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Win card ──────────────────────────────────────────────────────────────────

function WinCard({ win, index, accent, dark }: { win: Win; index: number; accent: string; dark: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-center gap-4" style={{ borderBottom: `2px solid ${accent}15`, background: `${accent}08` }}>
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{ background: accent, color: dark }}
        >
          {index}
        </span>
        <h3 className="font-bold text-gray-900 text-base">{win.title}</h3>
      </div>

      <div className="px-6 py-5 space-y-4">
        {win.problem && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">The problem</p>
            <p className="text-gray-700 text-sm leading-relaxed">{win.problem}</p>
          </div>
        )}
        {win.fix && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">The fix</p>
            <p className="text-gray-700 text-sm leading-relaxed">{win.fix}</p>
          </div>
        )}
        {win.flow && <FlowDiagram flow={win.flow} accent={accent} dark={dark} />}
        {win.scenario && (
          <div
            className="rounded-xl p-4 text-sm"
            style={{ background: `${accent}12`, borderLeft: `3px solid ${accent}` }}
          >
            <span className="font-bold text-xs uppercase tracking-wider block mb-1.5" style={{ color: accent }}>
              What it looks like
            </span>
            <span className="text-gray-700 italic leading-relaxed">{win.scenario}</span>
          </div>
        )}
        {win.future && (
          <div className="text-sm text-gray-500 italic leading-relaxed">
            <span className="not-italic font-bold text-xs uppercase tracking-wider text-gray-300 mr-2">
              90 days from now
            </span>
            {win.future}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ROI card ──────────────────────────────────────────────────────────────────

function ROICard({ metric, isTotal, accent, dark, overrideAmount }: {
  metric: Metric
  isTotal: boolean
  accent: string
  dark: string
  overrideAmount?: string
}) {
  return (
    <div className="rounded-2xl p-6" style={{ background: isTotal ? accent : dark }}>
      <div className="text-3xl font-bold mb-1" style={{ color: isTotal ? dark : accent }}>
        {overrideAmount ?? metric.amount}
      </div>
      <div className="font-semibold text-sm text-white mb-1">{metric.label}</div>
      {metric.assumption && (
        <div className="text-xs text-white/50 leading-snug">{metric.assumption}</div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AuditPage({ prospect, parsed }: Props) {
  const accent = hex(prospect.brand_accent, '#2d6a4f')
  const dark   = hex(prospect.brand_dark,   '#1a1a2e')

  const baseMetrics   = parsed.metrics.filter(m => m.amount.includes('€'))
  const baseTotal     = baseMetrics.find(m => m.label.toLowerCase().includes('total'))
  const baseNonTotal  = baseMetrics.filter(m => !m.label.toLowerCase().includes('total'))

  const [treatmentValue, setTreatmentValue] = useState(100)
  const scale = treatmentValue / 100

  const scaledNonTotal = baseNonTotal.map(m => ({
    ...m,
    overrideAmount: formatEuro(Math.round(extractBaseValue(m.amount) * scale)) + '/yr',
  }))
  const scaledTotal = scaledNonTotal.reduce(
    (sum, m) => sum + Math.round(extractBaseValue(m.amount) * scale), 0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyNav
        businessName={prospect.business_name}
        logoUrl={prospect.logo_url}
        accent={accent}
        dark={dark}
      />
      <Hero prospect={prospect} accent={accent} dark={dark} />

      {/* ── Overview ─────────────────────────────────────────────────── */}
      <Section id="overview" title="What We Found On Your Site" accent={accent}>
        {prospect.screenshot_url && (
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prospect.screenshot_url}
              alt={`${prospect.business_name} website`}
              className="w-full object-cover object-top"
              style={{ maxHeight: 380 }}
            />
            {prospect.website && (
              <div className="px-4 py-2.5 bg-white border-t border-gray-100">
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {prospect.website}
                </a>
              </div>
            )}
          </div>
        )}
        <div className="space-y-3">
          {parsed.observations.map((obs, i) => (
            <ObservationCard key={i} text={obs} accent={accent} />
          ))}
        </div>
      </Section>

      <Separator className="max-w-4xl mx-auto" />

      {/* ── Reviews ──────────────────────────────────────────────────── */}
      <Section id="reviews" title="What Your Customers Are Saying" accent={accent}>
        {parsed.reviewStats && (
          <div className="rounded-2xl overflow-hidden mb-6" style={{ background: dark }}>
            <div className="grid grid-cols-3 divide-x divide-white/10">
              <div className="px-6 py-8 text-center">
                <div className="text-5xl font-bold mb-2" style={{ color: accent }}>
                  {parsed.reviewStats.rating}
                </div>
                <div className="text-white/40 text-xs uppercase tracking-wide">★ Google Rating</div>
              </div>
              <div className="px-6 py-8 text-center">
                <div className="text-5xl font-bold text-white mb-2">
                  {parsed.reviewStats.count}
                </div>
                <div className="text-white/40 text-xs uppercase tracking-wide">Reviews</div>
              </div>
              <div className="px-6 py-8 text-center flex flex-col justify-center">
                <div className="text-white/40 text-xs uppercase tracking-wide mb-2">#1 Complaint</div>
                <div className="text-white text-sm font-medium italic leading-snug">
                  {parsed.reviewStats.theme}
                </div>
              </div>
            </div>
          </div>
        )}
        {parsed.reviewBody && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <p className="text-gray-700 leading-relaxed text-sm">{parsed.reviewBody}</p>
          </div>
        )}
      </Section>

      <Separator className="max-w-4xl mx-auto" />

      {/* ── Wins ─────────────────────────────────────────────────────── */}
      <Section id="wins" title="3 Automation Wins" accent={accent}>
        <div className="space-y-5">
          {parsed.wins.map((win, i) => (
            <WinCard key={i} win={win} index={i + 1} accent={accent} dark={dark} />
          ))}
        </div>
        {parsed.curiosity && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-8 py-6 text-center shadow-sm">
            <p className="text-gray-500 italic text-sm leading-relaxed">{parsed.curiosity}</p>
          </div>
        )}
      </Section>

      <Separator className="max-w-4xl mx-auto" />

      {/* ── ROI ──────────────────────────────────────────────────────── */}
      <Section id="roi" title="ROI Snapshot" accent={accent}>
        {baseMetrics.length >= 2 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {scaledNonTotal.map((m, i) => (
                <ROICard key={i} metric={m} isTotal={false} accent={accent} dark={dark} overrideAmount={m.overrideAmount} />
              ))}
            </div>
            {baseTotal && (
              <ROICard metric={baseTotal} isTotal accent={accent} dark={dark}
                overrideAmount={formatEuro(scaledTotal) + '/yr'} />
            )}

            {/* Interactive calculator */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-1">Adjust for your practice</h3>
              <p className="text-xs text-gray-400 mb-6">
                Slide to match your average treatment value — estimates scale automatically.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average treatment value</span>
                  <span className="font-bold text-lg" style={{ color: accent }}>
                    {formatEuro(treatmentValue)}
                  </span>
                </div>
                <Slider
                  min={50} max={500} step={10}
                  value={[treatmentValue]}
                  onValueChange={([v]) => setTreatmentValue(v)}
                />
                <div className="flex justify-between text-xs text-gray-300">
                  <span>€50</span><span>€500</span>
                </div>
              </div>
              <div
                className="mt-6 rounded-xl p-5 text-center"
                style={{ background: `${accent}15` }}
              >
                <div className="text-4xl font-bold mb-1" style={{ color: accent }}>
                  {formatEuro(scaledTotal)}/yr
                </div>
                <p className="text-xs text-gray-500">
                  Conservative year-one estimate at {formatEuro(treatmentValue)} avg treatment
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 text-sm">
            ROI data not available.
          </div>
        )}
      </Section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 mt-6 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-semibold text-gray-800">Kevin Farrell</div>
            <div className="text-xs text-gray-400 mt-0.5">Automation Consultant &nbsp;·&nbsp; kevinfar@gmail.com</div>
          </div>
          <a
            href="mailto:kevinfar@gmail.com?subject=Re: Automation Opportunity"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-md"
            style={{ background: accent }}
          >
            Book a 15-min call →
          </a>
        </div>
      </footer>
    </div>
  )
}
