import { getAIOutputsByRole } from '@ghouse/supakit'
import { formatDateJST } from '@ghouse/core'
import { generateNewspaperHTML } from '@ghouse/report'

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

  // Generate enhanced HTML with visual elements
  const enhancedHTML = await generateNewspaperHTML(latestNewspaper.output_md)

  return <div dangerouslySetInnerHTML={{ __html: enhancedHTML }} />
}
