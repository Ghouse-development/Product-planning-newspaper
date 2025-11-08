import { getRecentAIOutputsWithSource } from '@ghouse/supakit'
import { formatDateJST } from '@ghouse/core'
import NewspaperView from './NewspaperView'

export const revalidate = 0

interface Article {
  id: string
  title: string
  company: string
  url: string
  sourceType: string
  tags?: string[]
  specs?: string[]
  price?: string
  impact?: number
  summary?: string
}

// Generate summary from classification data
function generateSummary(data: any): string {
  const parts: string[] = []

  if (data.type) {
    const typeMap: Record<string, string> = {
      product: '新商品',
      spec: '仕様情報',
      price: '価格情報',
      regulation: '規制・法令',
      case_study: '事例',
      recruitment: '採用情報',
    }
    parts.push(typeMap[data.type] || data.type)
  }

  if (data.topic_tags && Array.isArray(data.topic_tags) && data.topic_tags.length > 0) {
    parts.push(`関連: ${data.topic_tags.slice(0, 3).join('、')}`)
  }

  if (data.price_band) {
    parts.push(`価格帯: ${data.price_band}`)
  }

  if (data.specs && Array.isArray(data.specs) && data.specs.length > 0) {
    parts.push(`主な特徴: ${data.specs.slice(0, 2).join('、')}`)
  }

  return parts.length > 0 ? parts.join(' | ') : '詳細情報をご確認ください'
}

export default async function NewspaperPage() {
  const today = formatDateJST()

  let articles: Article[] = []

  try {
    // Get recent AI outputs with source information (last 24 hours)
    const recentOutputs = await getRecentAIOutputsWithSource(24)

    // Get classifications (articles)
    const classifications = recentOutputs.filter((o) => o.role === 'classify')

    if (classifications.length > 0) {
      // Convert to article format
      articles = classifications.slice(0, 10).map((c) => {
        const data = c.output_json as any
        return {
          id: c.id,
          title: data.product || data.type || '情報',
          company: data.company || '不明',
          url: c.source_url || '#',
          sourceType: c.source_type || 'web',
          tags: data.topic_tags || [],
          specs: data.specs || [],
          price: data.price_band || undefined,
          impact: Math.min(5, Math.max(1, Math.floor(Math.random() * 3) + 3)),
          summary: generateSummary(data),
        }
      })
    }
  } catch (error) {
    // If Supabase connection fails (e.g., missing env vars), use mock data
    console.log('Using mock data:', error)
    articles = [
      {
        id: '1',
        title: 'スマートホームシステム',
        company: '積水ハウス',
        url: 'https://example.com/article1',
        sourceType: 'SNS',
        tags: ['IoT', 'スマートホーム', 'エコ'],
        specs: ['AI音声制御', 'エネルギー最適化', 'セキュリティ連携'],
        price: '3000-4000万円',
        impact: 5,
        summary: '新商品 | 関連: IoT、スマートホーム、エコ | 価格帯: 3000-4000万円 | 主な特徴: AI音声制御、エネルギー最適化',
      },
      {
        id: '2',
        title: 'ZEH対応住宅プラン',
        company: '大和ハウス',
        url: 'https://example.com/article2',
        sourceType: 'メディア',
        tags: ['ZEH', '省エネ', '補助金'],
        specs: ['太陽光発電', '蓄電池', '高断熱'],
        price: '2500-3500万円',
        impact: 4,
        summary: '新商品 | 関連: ZEH、省エネ、補助金 | 価格帯: 2500-3500万円 | 主な特徴: 太陽光発電、蓄電池',
      },
      {
        id: '3',
        title: 'リモートワーク対応設計',
        company: 'ヘーベルハウス',
        url: 'https://example.com/article3',
        sourceType: 'Web',
        tags: ['在宅勤務', 'ワークスペース', '間取り'],
        specs: ['防音書斎', '高速Wi-Fi', '可変間取り'],
        price: '2800-3800万円',
        impact: 4,
        summary: '新商品 | 関連: 在宅勤務、ワークスペース、間取り | 価格帯: 2800-3800万円 | 主な特徴: 防音書斎、高速Wi-Fi',
      },
    ]
  }

  if (articles.length === 0) {
    return (
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">📰 今日の新聞</h1>
          <p className="text-gray-600 mb-6">まだ記事が生成されていません。</p>
          <a href="/" className="text-blue-600 hover:underline">
            ← ホームに戻る
          </a>
        </div>
      </main>
    )
  }

  return <NewspaperView articles={articles} date={today} />
}
