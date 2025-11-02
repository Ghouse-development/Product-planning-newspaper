import { getUsageMetrics } from '@ghouse/supakit'
import { formatDateJST } from '@ghouse/core'
import MetricsCard from '@/components/MetricsCard'

export const revalidate = 0 // Disable caching for real-time data

export default async function DashboardPage() {
  const metrics = await getUsageMetrics()
  const today = formatDateJST()

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-primary">📊 ダッシュボード</h1>
          <p className="text-gray-600">APIコスト・使用状況・トレンド推移</p>
        </header>

        <div className="mb-6">
          <a
            href="/"
            className="text-secondary hover:underline"
          >
            ← ホームに戻る
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="今日の使用"
            value={`$${metrics.today_cost.toFixed(4)}`}
            subtitle={`${metrics.today_calls} calls`}
            detail={`${metrics.today_tokens_in.toLocaleString()} in / ${metrics.today_tokens_out.toLocaleString()} out`}
            color="primary"
          />

          <MetricsCard
            title="直近7日平均"
            value={`$${metrics.avg_7d_cost.toFixed(4)}`}
            subtitle="/ 日"
            color="secondary"
          />

          <MetricsCard
            title="残高"
            value={`$${metrics.balance.toFixed(2)}`}
            subtitle={`あと ${metrics.remaining_reports} 回`}
            color="green"
          />

          <MetricsCard
            title="今月累計"
            value={`$${metrics.month_total.toFixed(4)}`}
            color="orange"
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-secondary">💡 コスト最適化のヒント</h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                現在のペースで<strong className="text-primary">{metrics.remaining_reports}回</strong>のレポート生成が可能です
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                1回あたりの平均コスト：<strong className="text-primary">${metrics.avg_7d_cost.toFixed(4)}</strong>
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                残高が少なくなったら、Anthropicの管理画面でクレジットを追加してください
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-secondary">📅 日次データ</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">日付</th>
                  <th className="text-right py-2 px-4">コスト</th>
                  <th className="text-right py-2 px-4">Calls</th>
                  <th className="text-right py-2 px-4">Tokens (In/Out)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{today}</td>
                  <td className="text-right py-2 px-4">${metrics.today_cost.toFixed(4)}</td>
                  <td className="text-right py-2 px-4">{metrics.today_calls}</td>
                  <td className="text-right py-2 px-4">
                    {metrics.today_tokens_in.toLocaleString()} / {metrics.today_tokens_out.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
