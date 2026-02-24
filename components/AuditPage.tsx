'use client'

import { useState, useEffect, useRef } from 'react'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { Prospect, ParsedContent, Win, Metric } from '@/lib/types'
import { extractBaseValue } from '@/lib/parseContent'

interface Props {
  prospect: Prospect
  parsed: ParsedContent
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hex(color: string | null, fallback: string) {
  return color ? `#${color}` : fallback
}

function formatEuro(n: number) {
  return '€' + n.toLocaleString('en-IE')
}

// Animated count-up hook — triggers when element enters viewport
function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true) },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started || target === 0) return
    let frame = 0
    const totalFrames = Math.round(duration / 16)
    const timer = setInterval(() => {
      frame++
      // Ease-out cubic
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3)
      setCount(Math.floor(progress * target))
      if (frame >= totalFrames) { setCount(target); clearInterval(timer) }
    }, 16)
    return () => clearInterval(timer)
  }, [started, target, duration])

  return { count, ref }
}

// ── Win impact labels ─────────────────────────────────────────────────────────

const WIN_LABELS = [
  { label: 'Quick Win', icon: '⚡', color: 'rgba(251,191,36,0.15)', text: '#f59e0b' },
  { label: 'High Impact', icon: '📈', color: 'rgba(34,197,94,0.12)', text: '#16a34a' },
  { label: 'Retention', icon: '🔁', color: 'rgba(99,102,241,0.12)', text: '#6366f1' },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StickyNav({ businessName, logoUrl, accent, dark }: {
  businessName: string
  logoUrl: string | null
  accent: string
  dark: string
}) {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/10"
      style={{ background: dark }}
      aria-label="Page navigation"
    >
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl && (
            <div className="bg-white rounded-lg p-1.5 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={`${businessName} logo`} className="h-6 w-auto object-contain" style={{ maxWidth: 80 }} />
            </div>
          )}
          <span className="text-white/70 text-sm font-medium truncate hidden sm:block">
            {businessName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[
            { href: '#overview', label: 'Overview' },
            { href: '#reviews', label: 'Reviews' },
            { href: '#wins', label: 'Wins' },
            { href: '#roi', label: 'ROI' },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-sm text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 min-h-[44px] flex items-center"
            >
              {l.label}
            </a>
          ))}
          <a
            href="mailto:kevinfar@gmail.com?subject=Re: Automation Opportunity"
            className="ml-2 px-4 py-2 rounded-full text-sm font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 flex-shrink-0 min-h-[44px] flex items-center animate-pulse hover:animate-none"
            style={{ background: accent, color: dark, ['--tw-ring-color' as string]: accent }}
          >
            Book a call
          </a>
        </div>
      </div>
    </nav>
  )
}

function Hero({ prospect, accent, dark }: { prospect: Prospect; accent: string; dark: string }) {
  return (
    <header className="py-16 relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${dark} 0%, ${dark}f0 100%)` }}>
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="flex items-center justify-between gap-8">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold mb-3" style={{ color: accent }}>
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
                <Badge className="text-xs px-3 py-1 font-semibold border"
                  style={{ background: `${accent}25`, color: accent, borderColor: `${accent}50` }}>
                  ⭐ {prospect.google_rating} Google rating
                </Badge>
              )}
              {prospect.review_count && (
                <Badge className="text-xs px-3 py-1 font-semibold border"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)' }}>
                  {prospect.review_count} reviews
                </Badge>
              )}
              {prospect.city && (
                <Badge className="text-xs px-3 py-1 font-semibold border"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)' }}>
                  📍 {prospect.city}
                </Badge>
              )}
            </div>
          </div>
          {prospect.logo_url && (
            <div className="flex-shrink-0 hidden sm:block">
              <div className="bg-white rounded-2xl p-4 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prospect.logo_url}
                  alt={`${prospect.business_name} logo`}
                  className="h-16 w-auto object-contain"
                  style={{ maxWidth: 160 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function Section({ id, title, accent, children }: {
  id: string; title: string; accent: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="py-12 scroll-mt-14">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: accent }}>
            {title}
          </h2>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        {children}
      </div>
    </section>
  )
}

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

// ── Before / After split (21st.dev inspired) ──────────────────────────────────

function BeforeAfter({ problem, scenario, accent, dark }: {
  problem: string; scenario: string; accent: string; dark: string
}) {
  return (
    <div className="grid grid-cols-2 gap-3 my-4 text-sm">
      {/* Before */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base" aria-hidden>❌</span>
          <span className="font-bold text-xs uppercase tracking-wide text-red-500">Right now</span>
        </div>
        <p className="text-gray-700 leading-relaxed">{problem}</p>
      </div>
      {/* After */}
      <div className="rounded-xl p-4" style={{ background: `${accent}12`, border: `1px solid ${accent}35` }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base" aria-hidden>✅</span>
          <span className="font-bold text-xs uppercase tracking-wide" style={{ color: accent }}>With automation</span>
        </div>
        <p className="text-gray-700 leading-relaxed italic">{scenario}</p>
      </div>
    </div>
  )
}

// ── Flow diagram ──────────────────────────────────────────────────────────────

function FlowDiagram({ flow, accent, dark }: { flow: string; accent: string; dark: string }) {
  const parts = flow.split('|').map(s => s.trim()).filter(Boolean)
  if (parts.length < 2) return null
  return (
    <div className="flex items-stretch gap-1.5 my-4" role="list" aria-label="Automation flow">
      {parts.map((step, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-1 min-w-0" role="listitem">
          <div
            className="flex-1 rounded-xl px-3 py-3 text-center min-w-0"
            style={{ background: i === 1 ? accent : dark }}
          >
            <div className="text-xs font-bold mb-1" style={{ color: i === 1 ? dark : accent }}>
              {i + 1}
            </div>
            <div className="text-white text-xs leading-tight">{step}</div>
          </div>
          {i < parts.length - 1 && (
            <span className="text-gray-300 text-sm font-bold flex-shrink-0" aria-hidden>›</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Win card (redesigned with Before/After) ───────────────────────────────────

function WinCard({ win, index, accent, dark }: { win: Win; index: number; accent: string; dark: string }) {
  const badge = WIN_LABELS[(index - 1) % WIN_LABELS.length]
  return (
    <article className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Title row */}
      <div className="px-6 py-5 flex items-center justify-between gap-4"
        style={{ borderBottom: `1px solid ${accent}20`, background: `${accent}06` }}>
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: accent, color: dark }}
            aria-label={`Win ${index}`}
          >
            {index}
          </span>
          <h3 className="font-bold text-gray-900 text-base leading-snug">{win.title}</h3>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 hidden sm:flex items-center gap-1"
          style={{ background: badge.color, color: badge.text }}
        >
          <span aria-hidden>{badge.icon}</span> {badge.label}
        </span>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Before / After split */}
        {win.problem && win.scenario && (
          <BeforeAfter problem={win.problem} scenario={win.scenario} accent={accent} dark={dark} />
        )}

        {/* The fix */}
        {win.fix && (
          <div className="rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-700 leading-relaxed border border-gray-100">
            <span className="font-bold text-xs uppercase tracking-wide text-gray-400 mr-2">The fix</span>
            {win.fix}
          </div>
        )}

        {/* Flow */}
        {win.flow && <FlowDiagram flow={win.flow} accent={accent} dark={dark} />}

        {/* 90 days */}
        {win.future && (
          <p className="text-sm text-gray-500 italic leading-relaxed">
            <span className="not-italic font-bold text-xs uppercase tracking-wide text-gray-300 mr-2">
              90 days from now
            </span>
            {win.future}
          </p>
        )}
      </div>
    </article>
  )
}

// ── Animated ROI card ─────────────────────────────────────────────────────────

function ROICard({ metric, isTotal, accent, dark, overrideAmount }: {
  metric: Metric; isTotal: boolean; accent: string; dark: string; overrideAmount?: string
}) {
  const raw = overrideAmount ?? metric.amount
  const numericTarget = extractBaseValue(raw)
  const { count, ref } = useCountUp(numericTarget)

  // Format the animated display
  const prefix = raw.match(/^[€$£]/) ? raw[0] : '€'
  const suffix = raw.includes('/yr') ? '/yr' : ''
  const displayValue = numericTarget > 0
    ? prefix + count.toLocaleString('en-IE') + suffix
    : raw

  return (
    <div
      ref={ref}
      className="rounded-2xl p-6 transition-transform hover:scale-[1.02] duration-200"
      style={{ background: isTotal ? accent : dark }}
    >
      <div className="text-3xl font-bold mb-1 tabular-nums" style={{ color: isTotal ? dark : accent }}>
        {displayValue}
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

  const baseMetrics  = parsed.metrics.filter(m => m.amount.includes('€'))
  const baseTotal    = baseMetrics.find(m => m.label.toLowerCase().includes('total'))
  const baseNonTotal = baseMetrics.filter(m => !m.label.toLowerCase().includes('total'))

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
      <StickyNav businessName={prospect.business_name} logoUrl={prospect.logo_url} accent={accent} dark={dark} />
      <Hero prospect={prospect} accent={accent} dark={dark} />

      {/* ── Overview ─────────────────────────────────────────────── */}
      <Section id="overview" title="What We Found On Your Site" accent={accent}>
        {prospect.screenshot_url && (
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={prospect.screenshot_url}
              alt={`Screenshot of ${prospect.business_name} website`}
              className="w-full object-cover object-top"
              style={{ maxHeight: 380 }}
            />
            {prospect.website && (
              <div className="px-4 py-2.5 bg-white border-t border-gray-100">
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus-visible:underline"
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

      <Separator />

      {/* ── Reviews ──────────────────────────────────────────────── */}
      <Section id="reviews" title="What Your Customers Are Saying" accent={accent}>
        {parsed.reviewStats && (
          <div className="rounded-2xl overflow-hidden mb-6 shadow-sm" style={{ background: dark }}>
            <div className="grid grid-cols-3 divide-x divide-white/10">
              <div className="px-6 py-8 text-center">
                <div className="text-5xl font-bold mb-2 tabular-nums" style={{ color: accent }}>
                  {parsed.reviewStats.rating}
                </div>
                <div className="text-white/40 text-xs uppercase tracking-wide">★ Google Rating</div>
              </div>
              <div className="px-6 py-8 text-center">
                <div className="text-5xl font-bold text-white mb-2 tabular-nums">
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

      <Separator />

      {/* ── Wins ─────────────────────────────────────────────────── */}
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

      <Separator />

      {/* ── ROI ──────────────────────────────────────────────────── */}
      <Section id="roi" title="ROI Snapshot" accent={accent}>
        {baseMetrics.length >= 2 ? (
          <div className="space-y-4">
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
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mt-6">
              <h3 className="font-bold text-gray-800 mb-1">Adjust for your practice</h3>
              <p className="text-xs text-gray-400 mb-6">
                Slide to match your average treatment value — estimates scale automatically.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average treatment value</span>
                  <span className="font-bold text-lg tabular-nums" style={{ color: accent }}>
                    {formatEuro(treatmentValue)}
                  </span>
                </div>
                <Slider
                  min={50} max={500} step={10}
                  value={[treatmentValue]}
                  onValueChange={([v]) => setTreatmentValue(v)}
                  aria-label="Average treatment value"
                />
                <div className="flex justify-between text-xs text-gray-300">
                  <span>€50</span><span>€500</span>
                </div>
              </div>
              <div className="mt-6 rounded-xl p-5 text-center" style={{ background: `${accent}15` }}>
                <div className="text-4xl font-bold mb-1 tabular-nums" style={{ color: accent }}>
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

      {/* ── Footer CTA ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 mt-6 bg-white" role="contentinfo">
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-bold text-gray-800">Kevin Farrell</div>
            <div className="text-xs text-gray-400 mt-0.5">
              Automation Consultant &nbsp;·&nbsp; kevinfar@gmail.com
            </div>
          </div>
          <a
            href="mailto:kevinfar@gmail.com?subject=Re: Automation Opportunity"
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 min-h-[44px]"
            style={{ background: accent, ['--tw-ring-color' as string]: accent }}
          >
            Book a 15-min call →
          </a>
        </div>
      </footer>
    </div>
  )
}
