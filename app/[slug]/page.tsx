import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { parseContent } from '@/lib/parseContent'
import { AuditPage } from '@/components/AuditPage'
import type { Prospect } from '@/lib/types'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const db = createServerClient()
  const { data } = await db.from('prospects').select('business_name').eq('slug', slug).maybeSingle()
  return {
    title: data ? `${data.business_name} — Automation Brief` : 'Audit',
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
