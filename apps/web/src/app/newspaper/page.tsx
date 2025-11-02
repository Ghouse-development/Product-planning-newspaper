import { getAIOutputsByRole } from '@ghouse/supakit'
import { formatDateJST } from '@ghouse/core'

export const revalidate = 0

export default async function NewspaperPage() {
  const today = formatDateJST()

  // Get latest newspaper output
  const newspapers = await getAIOutputsByRole('newspaper', 1)
  const latestNewspaper = newspapers[0]

  if (!latestNewspaper || !latestNewspaper.output_md) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-primary">📰 今日の新聞</h1>
          <p className="text-gray-600 mb-6">まだ新聞が生成されていません。</p>
          <a href="/" className="text-secondary hover:underline">
            ← ホームに戻る
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <a href="/" className="text-secondary hover:underline">
            ← ホームに戻る
          </a>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-secondary text-white rounded hover:bg-opacity-90"
          >
            📊 ダッシュボード
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="newspaper-content prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: latestNewspaper.output_md }} />
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          生成日時: {new Date(latestNewspaper.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
        </div>
      </div>
    </main>
  )
}
