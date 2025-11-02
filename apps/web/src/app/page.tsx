import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-primary border-b-4 border-primary pb-2">
            G-HOUSE トレンドAIインサイト
          </h1>
          <p className="text-xl text-gray-600">
            住宅業界のトレンドを自動収集・分析し、日刊新聞形式で配信
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/newspaper"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-l-4 border-primary"
          >
            <h2 className="text-2xl font-bold mb-2 text-primary">📰 今日の新聞</h2>
            <p className="text-gray-600">
              最新のトレンド情報を新聞形式で閲覧
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-l-4 border-secondary"
          >
            <h2 className="text-2xl font-bold mb-2 text-secondary">📊 ダッシュボード</h2>
            <p className="text-gray-600">
              APIコスト・トレンド推移・使用状況を確認
            </p>
          </Link>

          <Link
            href="/archive"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-l-4 border-secondary"
          >
            <h2 className="text-2xl font-bold mb-2 text-secondary">📚 アーカイブ</h2>
            <p className="text-gray-600">
              過去の新聞を閲覧・検索
            </p>
          </Link>

          <Link
            href="/settings"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-l-4 border-gray-400"
          >
            <h2 className="text-2xl font-bold mb-2 text-gray-700">⚙️ 設定</h2>
            <p className="text-gray-600">
              監視対象・RSS・通知設定
            </p>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-accent rounded-lg">
          <h3 className="text-xl font-bold mb-4 text-secondary">🚀 システムステータス</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">17</div>
              <div className="text-sm text-gray-600">監視対象企業</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-gray-600">情報源</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">毎朝8時</div>
              <div className="text-sm text-gray-600">自動配信</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">稼働中</div>
              <div className="text-sm text-gray-600">システム状態</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
