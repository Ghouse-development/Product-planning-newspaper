export default function ArchivePage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary">📚 アーカイブ</h1>
          <p className="text-gray-600">過去の新聞を閲覧・検索</p>
        </header>

        <div className="mb-6">
          <a href="/" className="text-secondary hover:underline">
            ← ホームに戻る
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600">
            アーカイブ機能は実装予定です。
          </p>
          <p className="text-gray-600 mt-4">
            過去の新聞は<code className="bg-gray-100 px-2 py-1 rounded">ai_outputs</code>テーブルの
            <code className="bg-gray-100 px-2 py-1 rounded">role='newspaper'</code>から取得できます。
          </p>
        </div>
      </div>
    </main>
  )
}
