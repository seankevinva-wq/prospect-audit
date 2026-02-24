import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { parseContent } from '@/lib/parseContent'
import { AuditPage } from '@/components/AuditPage'
import type { Prospect } from '@/lib/types'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

function industryEmoji(industry: string | null | undefined): string {
  if (!industry) return '📋'
  const s = industry.toLowerCase()
  if (s.includes('dent')) return '🦷'
  if (s.includes('restaurant') || s.includes('food') || s.includes('cafe')) return '🍽️'
  if (s.includes('gym') || s.includes('fitness')) return '💪'
  if (s.includes('law') || s.includes('legal')) return '⚖️'
  if (s.includes('doctor') || s.includes('medical') || s.includes('clinic')) return '🩺'
  if (s.includes('hotel') || s.includes('hospit')) return '🏨'
  if (s.includes('real estate') || s.includes('property')) return '🏠'
  if (s.includes('salon') || s.includes('beauty') || s.includes('spa')) return '💅'
  if (s.includes('plumb')) return '🔧'
  if (s.includes('electric')) return '⚡'
  if (s.includes('account') || s.includes('finance')) return '📊'
  if (s.includes('school') || s.includes('education')) return '🎓'
  if (s.includes('photo')) return '📸'
  if (s.includes('vet')) return '🐾'
  if (s.includes('pharmacy') || s.includes('pharma')) return '💊'
  return '📋'
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const db = createServerClient()
  const { data } = await db
    .from('prospects')
    .select('business_name, industry')
    .eq('slug', slug)
    .maybeSingle()

  const emoji = industryEmoji(data?.industry)
  const faviconSvg = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`

  return {
    title: data ? `${data.business_name} — Automation Brief` : 'Automation Brief',
    icons: { icon: faviconSvg },
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const db = createServerClient()

  const { data: prospect } = await db
    .from('prospects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (!prospect) notFound()

  // Increment view count (fire-and-forget)
  db.from('prospects')
    .update({ page_views: (prospect.page_views || 0) + 1 })
    .eq('id', prospect.id)
    .then(() => {})

  const parsed = parseContent(prospect.pitch_md || '')

  return <AuditPage prospect={prospect as Prospect} parsed={parsed} />
}
