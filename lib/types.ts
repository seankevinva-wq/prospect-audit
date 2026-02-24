export interface Metric {
  amount: string
  label: string
  assumption: string
}

export interface Win {
  title: string
  problem: string
  fix: string
  flow: string
  scenario: string
  future: string
}

export interface ParsedContent {
  observations: string[]
  reviewStats: { rating: string; count: string; theme: string } | null
  reviewBody: string
  wins: Win[]
  curiosity: string
  metrics: Metric[]
}

export interface Prospect {
  id: string
  business_name: string
  slug: string
  website: string | null
  city: string | null
  country: string | null
  industry: string | null
  google_rating: number | null
  review_count: number | null
  automation_score: number | null
  pitch_md: string | null
  logo_url: string | null
  screenshot_url: string | null
  video_url: string | null
  brand_accent: string | null
  brand_dark: string | null
  page_views: number
  owner_name: string | null
  status: string
}
