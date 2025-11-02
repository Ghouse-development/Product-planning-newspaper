export default function SettingsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary">⚙️ 設定</h1>
          <p className="text-gray-600">監視対象・RSS・通知設定</p>
        </header>

        <div className="mb-6">
          <a href="/" className="text-secondary hover:underline">
            ← ホームに戻る
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-secondary">監視対象企業</h2>
            <p className="text-gray-600 mb-4">
              <code className="bg-gray-100 px-2 py-1 rounded">config/companies.json</code>を編集
            </p>
            <p className="text-sm text-gray-500">
              現在17社を監視中
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-secondary">情報源設定</h2>
            <p className="text-gray-600 mb-4">
              <code className="bg-gray-100 px-2 py-1 rounded">config/sources.json</code>を編集
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• PR TIMES: 5クエリ</li>
              <li>• 新建ハウジング: RSS</li>
              <li>• Instagram: rss.app経由</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-secondary">通知設定</h2>
            <p className="text-gray-600 mb-4">
              Google Chat Webhook: 設定済み
            </p>
            <p className="text-sm text-gray-500">
              毎朝8時に自動配信
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-secondary">API設定</h2>
            <p className="text-gray-600 mb-4">
              環境変数で管理（Vercel）
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Claude API: 設定済み</li>
              <li>• Gemini API: 設定済み</li>
              <li>• Supabase: 設定済み</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-accent rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4 text-secondary">🔧 設定変更方法</h3>
          <ol className="space-y-2 text-gray-700">
            <li>1. GitHubリポジトリの該当ファイルを編集</li>
            <li>2. コミット＆プッシュ</li>
            <li>3. Vercelが自動デプロイ（約2〜3分）</li>
            <li>4. 次回のCron実行時から新設定が適用</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
