import type { ParsedContent, Win, Metric } from './types'

export function parseContent(content: string): ParsedContent {
  const out: ParsedContent = {
    observations: [],
    reviewStats: null,
    reviewBody: '',
    wins: [],
    curiosity: '',
    metrics: [],
  }

  if (!content) return out

  const lines = content.split('\n')
  let section: string | null = null
  let winBuf: Win | null = null
  const reviewBuf: string[] = []

  const flushWin = () => {
    if (winBuf) { out.wins.push(winBuf); winBuf = null }
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (/^WHAT WE FOUND ON YOUR SITE/i.test(line)) { section = 'obs'; continue }
    if (/^WHAT YOUR CUSTOMERS ARE SAYING/i.test(line)) { flushWin(); section = 'reviews'; continue }
    if (/^3 AUTOMATION WINS/i.test(line)) { section = 'wins'; continue }
    if (/^ROI SNAPSHOT/i.test(line)) { flushWin(); section = 'roi'; continue }

    if (section === 'obs') {
      const text = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim()
      if (text.length > 10) out.observations.push(text)
    }

    else if (section === 'reviews') {
      if (line.startsWith('STATS:')) {
        const parts = line.replace('STATS:', '').split('|').map(s => s.trim())
        out.reviewStats = { rating: parts[0] || '', count: parts[1] || '', theme: parts[2] || '' }
      } else if (line) {
        reviewBuf.push(line)
      }
    }

    else if (section === 'wins') {
      const newFmt = line.match(/^WIN\s*(\d+):\s*(.*)/i)
      const oldFmt = line.match(/^(\d+)\.\s+(.+)/)
      const winStart = newFmt || (oldFmt && +oldFmt[1] <= 3 ? oldFmt : null)
      if (winStart) {
        flushWin()
        winBuf = {
          title: winStart[2].trim().replace(/\*\*/g, ''),
          problem: '', fix: '', flow: '', scenario: '', future: '',
        }
        continue
      }
      if (line.startsWith('CURIOSITY:')) {
        flushWin()
        out.curiosity = line.replace('CURIOSITY:', '').trim()
        section = null
        continue
      }
      if (!winBuf) continue
      const labelMatch = line.match(/^(The problem|The fix|Flow|What it looks like|90 days from now):\s*(.*)/i)
      if (labelMatch) {
        const key = labelMatch[1].toLowerCase().replace(/\s+/g, '_')
        const val = labelMatch[2].replace(/\*\*/g, '').trim()
        if (key === 'the_problem') winBuf.problem = val
        else if (key === 'the_fix') winBuf.fix = val
        else if (key === 'flow') winBuf.flow = val
        else if (key === 'what_it_looks_like') winBuf.scenario = val
        else if (key === '90_days_from_now') winBuf.future = val
      }
    }

    else if (section === 'roi') {
      if (line.startsWith('METRIC:')) {
        const parts = line.replace('METRIC:', '').split('|').map(s => s.trim())
        out.metrics.push({ amount: parts[0] || '', label: parts[1] || '', assumption: parts[2] || '' })
      }
    }
  }

  flushWin()
  out.reviewBody = reviewBuf.join(' ').trim()
  return out
}

export function extractBaseValue(amount: string): number {
  const m = amount.match(/[\d,]+/)
  if (!m) return 0
  return parseInt(m[0].replace(/,/g, ''), 10)
}
