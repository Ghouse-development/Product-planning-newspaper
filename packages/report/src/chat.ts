import axios from 'axios';
import { createLogger } from '@ghouse/core';

const logger = createLogger('report:chat');

export interface ChatMessage {
  text: string;
  cards?: Array<{
    header?: { title: string };
    sections?: Array<{
      widgets?: Array<{
        textParagraph?: { text: string };
        buttons?: Array<{
          textButton: {
            text: string;
            onClick: { openLink: { url: string } };
          };
        }>;
      }>;
    }>;
  }>;
}

/**
 * Send message to Google Chat webhook
 */
export async function sendChatMessage(message: ChatMessage): Promise<void> {
  const webhookUrl = process.env.CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('CHAT_WEBHOOK_URL not configured, skipping Chat notification');
    return;
  }

  try {
    logger.info('Sending message to Google Chat');

    await axios.post(webhookUrl, message, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('Message sent to Google Chat successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to send message to Google Chat');
    throw error;
  }
}

/**
 * Send daily report to Google Chat
 */
export async function sendDailyReport(
  summary: string,
  pdfUrl?: string,
  webUrl?: string
): Promise<void> {
  const message: ChatMessage = {
    text: '📰 日次AIインサイトが届きました',
    cards: [
      {
        header: {
          title: 'G-HOUSE トレンドAIインサイト',
        },
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: summary,
                },
              },
              {
                buttons: [
                  ...(webUrl
                    ? [
                        {
                          textButton: {
                            text: 'Web版を見る',
                            onClick: {
                              openLink: {
                                url: webUrl,
                              },
                            },
                          },
                        },
                      ]
                    : []),
                  ...(pdfUrl
                    ? [
                        {
                          textButton: {
                            text: 'PDFをダウンロード',
                            onClick: {
                              openLink: {
                                url: pdfUrl,
                              },
                            },
                          },
                        },
                      ]
                    : []),
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  await sendChatMessage(message);
}
