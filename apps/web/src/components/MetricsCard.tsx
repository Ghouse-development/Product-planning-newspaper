interface MetricsCardProps {
  title: string
  value: string
  subtitle?: string
  detail?: string
  color?: 'primary' | 'secondary' | 'green' | 'orange'
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  detail,
  color = 'primary',
}: MetricsCardProps) {
  const colorClasses = {
    primary: 'border-primary text-primary',
    secondary: 'border-secondary text-secondary',
    green: 'border-green-600 text-green-600',
    orange: 'border-orange-600 text-orange-600',
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${colorClasses[color]}`}>
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      {subtitle && <div className="text-sm text-gray-500 mt-1">{subtitle}</div>}
      {detail && <div className="text-xs text-gray-400 mt-2">{detail}</div>}
    </div>
  )
}
