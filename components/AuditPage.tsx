'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import type { Prospect, ParsedContent, Win, Metric } from '@/lib/types'
import { extractBaseValue } from '@/lib/parseContent'

interface Props {
  prospect: Prospect
  parsed: ParsedContent
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hex(color: string | null, fallback: string) {
  return color ? `#${color}` : fallback
}

function formatEuro(n: number) {
  return '€' + n.toLocaleString('en-IE')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ObservationCard({ text, accent }: { text: string; accent: string }) {
  return (
    <div
      className="rounded-lg p-4 bg-gray-50 text-gray-700 text-sm leading-relaxed"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      {text}
    </div>
  )
}

function FlowDiagram({ flow, accent, dark }: { flow: string; accent: string; dark: string }) {
  const parts = flow.split('|').map(s => s.trim()).filter(Boolean)
  if (parts.length < 2) return null
  return (
    <div className="flex items-stretch gap-1 my-4">
      {parts.map((step, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div
            className="flex-1 rounded-lg px-3 py-3 text-center"
            style={{ background: i === 1 ? accent : dark }}
          >
            <div className="text-xs font-bold mb-1" style={{ color: i === 1 ? dark : accent }}>
              {i + 1}
            </div>
            <div className="text-white text-xs leading-tight">{step}</div>
          </div>
          {i < parts.length - 1 && (
            <div className="text-gray-400 text-sm font-bold flex-shrink-0">→</div>
          )}
        </div>
      ))}
    </div>
  )
}

function WinCard({ win, index, accent, dark }: { win: Win; index: number; accent: string; dark: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Title bar */}
      <div className="px-5 py-4" style={{ borderBottom: `2px solid ${accent}` }}>
        <div className="flex items-center gap-3">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: accent, color: dark }}
          >
            {index}
          </span>
          <h3 className="font-semibold text-gray-900 text-base">{win.title}</h3>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Problem */}
        {win.problem && (
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">The problem</span>
            <p className="text-gray-700 text-sm mt-1">{win.problem}</p>
          </div>
        )}

        {/* Fix */}
        {win.fix && (
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">The fix</span>
            <p className="text-gray-700 text-sm mt-1">{win.fix}</p>
          </div>
        )}

        {/* Flow diagram */}
        {win.flow && <FlowDiagram flow={win.flow} accent={accent} dark={dark} />}

        {/* What it looks like */}
        {win.scenario && (
          <div
            className="rounded-lg p-3 text-sm italic"
            style={{ background: `${accent}15`, borderLeft: `3px solid ${accent}` }}
          >
            <span className="not-italic font-semibold text-xs uppercase tracking-wide" style={{ color: accent }}>
              What it looks like&nbsp;&nbsp;
            </span>
            <span className="text-gray-700">{win.scenario}</span>
          </div>
        )}

        {/* 90 days */}
        {win.future && (
          <div className="text-sm text-gray-600 italic">
            <span className="not-italic font-semibold text-xs uppercase tracking-wide text-gray-400">
              90 days from now&nbsp;&nbsp;
            </span>
            {win.future}
          </div>
        )}
      </div>
    </div>
  )
}

function ROICard({
  metric,
  isTotal,
  accent,
  dark,
  overrideAmount,
}: {
  metric: Metric
  isTotal: boolean
  accent: string
  dark: string
  overrideAmount?: string
}) {
  const bg = isTotal ? accent : dark
  const numColor = isTotal ? dark : accent
  const textColor = 'white'

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-1"
      style={{ background: bg }}
    >
      <div className="text-3xl font-bold" style={{ color: numColor }}>
        {overrideAmount ?? metric.amount}
      </div>
      <div className="font-semibold text-sm" style={{ color: textColor }}>
        {metric.label}
      </div>
      {metric.assumption && (
        <div className="text-xs opacity-60 mt-1" style={{ color: textColor }}>
          {metric.assumption}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AuditPage({ prospect, parsed }: Props) {
  const accent = hex(prospect.brand_accent, '#2d6a4f')
  const dark   = hex(prospect.brand_dark,   '#1a1a2e')

  // ROI calculator state
  const baseMetrics = parsed.metrics.filter(m => m.amount.includes('€'))
  const baseTotal   = baseMetrics.find(m => m.label.toLowerCase().includes('total'))
  const baseNonTotal = baseMetrics.filter(m => !m.label.toLowerCase().includes('total'))

  // Extract base treatment value from first metric's assumption (e.g. "€100 avg")
  const defaultTreatmentValue = 100
  const [treatmentValue, setTreatmentValue] = useState(defaultTreatmentValue)

  // Scale non-total metrics by treatment value ratio
  const scale = treatmentValue / defaultTreatmentValue
  const scaledNonTotal = baseNonTotal.map(m => ({
    ...m,
    overrideAmount: formatEuro(Math.round(extractBaseValue(m.amount) * scale)) + '/yr',
  }))
  const scaledTotal = scaledNonTotal.reduce((sum, m) => sum + Math.round(extractBaseValue(m.amount) * scale), 0)

  const hasROI = baseMetrics.length >= 2

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header style={{ background: `linear-gradient(135deg, ${dark} 0%, ${dark}ee 100%)` }}>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between gap-6">
            {/* Left: name + meta */}
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: `${accent}` }}>
                Automation Opportunity Brief
              </p>
              <h1 className="text-white text-2xl sm:text-3xl font-bold leading-tight mb-2">
                {prospect.business_name}
              </h1>
              <p className="text-white/50 text-sm mb-4">
                Prepared by Kevin Farrell &nbsp;·&nbsp; kevinfar@gmail.com
              </p>
              <div className="flex flex-wrap gap-2">
                {prospect.google_rating && (
                  <Badge
                    className="text-xs font-medium px-2 py-0.5"
                    style={{ background: `${accent}30`, color: accent, border: `1px solid ${accent}50` }}
                  >
                    ⭐ {prospect.google_rating} Google rating
                  </Badge>
                )}
                {prospect.review_count && (
                  <Badge
                    className="text-xs font-medium px-2 py-0.5"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    {prospect.review_count} reviews
                  </Badge>
                )}
                {prospect.city && (
                  <Badge
                    className="text-xs font-medium px-2 py-0.5"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    📍 {prospect.city}
                  </Badge>
                )}
              </div>
            </div>

            {/* Right: logo */}
            {prospect.logo_url && (
              <div className="flex-shrink-0">
                <div className="bg-white rounded-xl p-3 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prospect.logo_url}
                    alt={prospect.business_name}
                    className="h-12 w-auto object-contain"
                    style={{ maxWidth: 140 }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab strip — sits at the bottom of the header */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex gap-0 border-b border-white/10">
            {['overview', 'reviews', 'wins', 'roi'].map(tab => (
              <button
                key={tab}
                id={`tab-trigger-${tab}`}
                className="px-4 py-3 text-sm font-medium text-white/50 hover:text-white/80 capitalize border-b-2 border-transparent transition-colors"
                style={{ '--tab-accent': accent } as React.CSSProperties}
              >
                {tab === 'roi' ? 'ROI' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview">
          <TabsList className="w-full mb-8 bg-white border border-gray-200 p-1 rounded-xl h-auto">
            <TabsTrigger value="overview" className="flex-1 rounded-lg text-sm data-[state=active]:text-white transition-colors" style={{ ['--accent' as string]: accent }}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 rounded-lg text-sm data-[state=active]:text-white transition-colors">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="wins" className="flex-1 rounded-lg text-sm data-[state=active]:text-white transition-colors">
              Automation Wins
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex-1 rounded-lg text-sm data-[state=active]:text-white transition-colors">
              ROI
            </TabsTrigger>
          </TabsList>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {prospect.screenshot_url && (
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prospect.screenshot_url}
                  alt={`${prospect.business_name} website`}
                  className="w-full object-cover object-top"
                  style={{ maxHeight: 360 }}
                />
                {prospect.website && (
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
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

            {parsed.observations.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  What We Found On Your Site
                </h2>
                <div className="space-y-3">
                  {parsed.observations.map((obs, i) => (
                    <ObservationCard key={i} text={obs} accent={accent} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── REVIEWS ──────────────────────────────────────────────────── */}
          <TabsContent value="reviews" className="mt-0">
            {parsed.reviewStats && (
              <div
                className="rounded-xl overflow-hidden mb-6"
                style={{ background: dark }}
              >
                <div className="grid grid-cols-3">
                  {/* Rating */}
                  <div className="px-6 py-6 text-center border-r border-white/10">
                    <div className="text-4xl font-bold mb-1" style={{ color: accent }}>
                      {parsed.reviewStats.rating} ★
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Google Rating</div>
                  </div>
                  {/* Count */}
                  <div className="px-6 py-6 text-center border-r border-white/10">
                    <div className="text-4xl font-bold text-white mb-1">
                      {parsed.reviewStats.count}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Reviews</div>
                  </div>
                  {/* Complaint */}
                  <div className="px-6 py-6 text-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">#1 Complaint</div>
                    <div className="text-white text-sm font-medium italic">
                      {parsed.reviewStats.theme}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {parsed.reviewBody && (
              <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  What Your Customers Are Saying
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm">{parsed.reviewBody}</p>
              </div>
            )}
          </TabsContent>

          {/* ── WINS ─────────────────────────────────────────────────────── */}
          <TabsContent value="wins" className="mt-0 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              3 Automation Wins
            </h2>
            {parsed.wins.map((win, i) => (
              <WinCard
                key={i}
                win={win}
                index={i + 1}
                accent={accent}
                dark={dark}
              />
            ))}
            {parsed.curiosity && (
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 text-center">
                <p className="text-gray-500 italic text-sm">{parsed.curiosity}</p>
              </div>
            )}
          </TabsContent>

          {/* ── ROI ──────────────────────────────────────────────────────── */}
          <TabsContent value="roi" className="mt-0 space-y-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1">
                ROI Snapshot
              </h2>
              <p className="text-xs text-gray-400">
                Estimates based on your practice&apos;s size and sector averages.
              </p>
            </div>

            {hasROI ? (
              <>
                {/* Metric cards */}
                <div className="grid grid-cols-2 gap-4">
                  {scaledNonTotal.map((m, i) => (
                    <ROICard
                      key={i}
                      metric={m}
                      isTotal={false}
                      accent={accent}
                      dark={dark}
                      overrideAmount={m.overrideAmount}
                    />
                  ))}
                </div>

                {/* Total card — full width */}
                {baseTotal && (
                  <div>
                    <ROICard
                      metric={baseTotal}
                      isTotal={true}
                      accent={accent}
                      dark={dark}
                      overrideAmount={formatEuro(scaledTotal) + '/yr'}
                    />
                  </div>
                )}

                <Separator />

                {/* Interactive calculator */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-800 mb-1">Adjust for your practice</h3>
                  <p className="text-xs text-gray-400 mb-5">
                    Slide to match your average treatment value — estimates scale automatically.
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average treatment value</span>
                      <span className="font-bold text-base" style={{ color: accent }}>
                        {formatEuro(treatmentValue)}
                      </span>
                    </div>
                    <Slider
                      min={50}
                      max={500}
                      step={10}
                      value={[treatmentValue]}
                      onValueChange={([v]) => setTreatmentValue(v)}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>€50</span>
                      <span>€500</span>
                    </div>
                  </div>

                  <div
                    className="mt-6 rounded-lg p-4 text-center"
                    style={{ background: `${accent}15` }}
                  >
                    <div className="text-3xl font-bold mb-1" style={{ color: accent }}>
                      {formatEuro(scaledTotal)}/yr
                    </div>
                    <div className="text-xs text-gray-500">
                      Conservative estimate at {formatEuro(treatmentValue)} avg treatment
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400 text-sm">
                ROI data not available for this prospect.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-semibold text-gray-800 text-sm">Kevin Farrell</div>
            <div className="text-xs text-gray-400 mt-0.5">Automation Consultant</div>
          </div>
          <a
            href="mailto:kevinfar@gmail.com?subject=Re: Automation Opportunity"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: accent }}
          >
            Book a 15-min call →
          </a>
        </div>
      </footer>

    </div>
  )
}
