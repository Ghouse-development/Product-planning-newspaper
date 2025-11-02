import axios from 'axios';
import { createLogger } from '@ghouse/core';

const logger = createLogger('report:error-notification');

/**
 * Send error notification to Google Chat
 * This is critical - we must know when something fails!
 */
export async function notifyError(context: {
  job: string;
  error: Error | string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const webhookUrl = process.env.CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.error('CHAT_WEBHOOK_URL not configured - cannot send error notification!');
    console.error('❌ ERROR NOTIFICATION FAILED - NO WEBHOOK URL', context);
    return;
  }

  const errorMessage = context.error instanceof Error ? context.error.message : String(context.error);
  const errorStack = context.error instanceof Error ? context.error.stack : undefined;

  const message = {
    text: `🚨 **エラー発生: ${context.job}**`,
    cards: [
      {
        header: {
          title: `⚠️ ${context.job} でエラーが発生しました`,
          subtitle: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        },
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `<b>エラー内容:</b><br>${errorMessage}`,
                },
              },
              ...(errorStack
                ? [
                    {
                      textParagraph: {
                        text: `<b>スタックトレース:</b><br><font size="1"><code>${errorStack.substring(0, 500)}</code></font>`,
                      },
                    },
                  ]
                : []),
              ...(context.details
                ? [
                    {
                      textParagraph: {
                        text: `<b>詳細:</b><br><code>${JSON.stringify(context.details, null, 2).substring(0, 500)}</code>`,
                      },
                    },
                  ]
                : []),
              {
                textParagraph: {
                  text: '⚠️ <b>対応が必要です！</b><br>Vercel Dashboard → Functions → Logs で詳細を確認してください。',
                },
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    logger.info({ job: context.job }, 'Error notification sent successfully');
  } catch (notificationError) {
    // Double failure - log to console at minimum
    logger.error({ error: notificationError, originalContext: context }, 'Failed to send error notification!');
    console.error('❌❌ CRITICAL: ERROR NOTIFICATION FAILED', {
      original: context,
      notification_error: notificationError,
    });
  }
}

/**
 * Send success notification to Google Chat
 */
export async function notifySuccess(context: {
  job: string;
  summary: string;
  metrics?: Record<string, number>;
}): Promise<void> {
  const webhookUrl = process.env.CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('CHAT_WEBHOOK_URL not configured - skipping success notification');
    return;
  }

  const message = {
    text: `✅ ${context.job} 完了`,
    cards: [
      {
        header: {
          title: `✅ ${context.job} 正常完了`,
          subtitle: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        },
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: context.summary,
                },
              },
              ...(context.metrics
                ? [
                    {
                      textParagraph: {
                        text: `<b>メトリクス:</b><br>${Object.entries(context.metrics)
                          .map(([key, value]) => `• ${key}: ${value}`)
                          .join('<br>')}`,
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
      },
    ],
  };

  try {
    await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    logger.info({ job: context.job }, 'Success notification sent');
  } catch (error) {
    logger.error({ error, context }, 'Failed to send success notification');
  }
}
