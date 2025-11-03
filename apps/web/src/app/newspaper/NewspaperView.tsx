'use client'

import { ArticleCard } from '@/components/ArticleCard'

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
}

interface NewspaperViewProps {
  articles: Article[]
  date: string
}

export default function NewspaperView({ articles, date }: NewspaperViewProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-blue-600 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            📰 G-HOUSE トレンドAIインサイト
          </h1>
          <p className="text-xl text-gray-600">{date} 朝刊</p>
          <p className="text-sm text-gray-500 mt-2">
            💡 カードをクリックして詳細を表示
          </p>
        </div>
      </div>

      {/* Article Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            📌 今日のトピック ({articles.length}件)
          </h2>
          <p className="text-gray-600">気になる記事をクリックして詳細を確認</p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">まだ記事がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                title={article.title}
                company={article.company}
                url={article.url}
                sourceType={article.sourceType}
                tags={article.tags}
                specs={article.specs}
                price={article.price}
                impact={article.impact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center">
          <a
            href="/"
            className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
          >
            ← ホームに戻る
          </a>
        </div>
      </div>
    </main>
  )
}
