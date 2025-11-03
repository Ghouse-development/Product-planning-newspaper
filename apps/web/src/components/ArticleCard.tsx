'use client'

import { useState } from 'react'

interface ArticleCardProps {
  title: string
  company: string
  url: string
  sourceType: string
  tags?: string[]
  summary?: string
  impact?: number
  specs?: string[]
  price?: string
}

export function ArticleCard({
  title,
  company,
  url,
  sourceType,
  tags = [],
  summary,
  impact = 3,
  specs = [],
  price,
}: ArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getIcon = (type: string) => {
    if (type.includes('sns') || type.includes('SNS')) return '💬'
    if (type.includes('media') || type.includes('メディア')) return '📰'
    return '🌐'
  }

  const getImpactColor = (level: number) => {
    if (level >= 4) return 'bg-red-500'
    if (level >= 3) return 'bg-orange-500'
    return 'bg-yellow-500'
  }

  return (
    <div className="article-card-container">
      {/* Card Preview */}
      <div
        className="article-card-preview"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="card-icon">{getIcon(sourceType)}</div>
        <div className="card-content">
          <div className="card-header">
            <h3 className="card-title">
              【{company}】{title}
            </h3>
            <div className={`impact-badge ${getImpactColor(impact)}`}>
              {'★'.repeat(impact)}
            </div>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="card-url-button"
            onClick={(e) => e.stopPropagation()}
          >
            🔗 元記事を見る
          </a>
          {tags.length > 0 && (
            <div className="card-tags">
              {tags.slice(0, 3).map((tag, i) => (
                <span key={i} className="tag-mini">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="expand-indicator">{isExpanded ? '▲' : '▼'}</div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="article-details">
          {summary && (
            <div className="detail-section">
              <h4>📝 要約</h4>
              <p>{summary}</p>
            </div>
          )}
          {price && (
            <div className="detail-section">
              <h4>💰 価格帯</h4>
              <p>{price}</p>
            </div>
          )}
          {specs.length > 0 && (
            <div className="detail-section">
              <h4>🔧 主な仕様</h4>
              <ul className="spec-list-compact">
                {specs.map((spec, i) => (
                  <li key={i}>✓ {spec}</li>
                ))}
              </ul>
            </div>
          )}
          {tags.length > 0 && (
            <div className="detail-section">
              <h4>🏷️ 関連タグ</h4>
              <div className="tags-full">
                {tags.map((tag, i) => (
                  <span key={i} className="tag-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .article-card-container {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .article-card-container:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .article-card-preview {
          display: flex;
          align-items: center;
          padding: 24px;
          cursor: pointer;
          gap: 20px;
        }

        .card-icon {
          font-size: 48px;
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
        }

        .card-content {
          flex: 1;
          min-width: 0;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .card-title {
          font-size: 20px;
          font-weight: bold;
          color: #1a202c;
          margin: 0;
          flex: 1;
          min-width: 200px;
        }

        .impact-badge {
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          white-space: nowrap;
        }

        .card-url-button {
          display: inline-block;
          background: linear-gradient(135deg, #e63946 0%, #d62839 100%);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          font-size: 16px;
          transition: all 0.3s ease;
          margin-bottom: 12px;
        }

        .card-url-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(230, 57, 70, 0.4);
        }

        .card-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tag-mini {
          background: #e2e8f0;
          color: #4a5568;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .expand-indicator {
          font-size: 24px;
          color: #a0aec0;
          flex-shrink: 0;
        }

        .article-details {
          border-top: 2px solid #e2e8f0;
          padding: 24px;
          background: #f7fafc;
        }

        .detail-section {
          margin-bottom: 20px;
        }

        .detail-section:last-child {
          margin-bottom: 0;
        }

        .detail-section h4 {
          font-size: 16px;
          font-weight: bold;
          color: #2d3748;
          margin: 0 0 8px 0;
        }

        .detail-section p {
          color: #4a5568;
          line-height: 1.6;
          margin: 0;
        }

        .spec-list-compact {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .spec-list-compact li {
          color: #4a5568;
          padding: 4px 0;
        }

        .tags-full {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tag-full {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .article-card-preview {
            flex-direction: column;
            text-align: center;
          }

          .card-header {
            flex-direction: column;
            align-items: center;
          }

          .card-title {
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}
