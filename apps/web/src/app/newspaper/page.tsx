import { getRecentAIOutputsWithSource } from '@ghouse/supakit'
import { formatDateJST } from '@ghouse/core'
import NewspaperView from './NewspaperView'

export const revalidate = 0

export default async function NewspaperPage() {
  const today = formatDateJST()

  let articles = []

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
