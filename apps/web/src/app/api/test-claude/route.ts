import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  }

  const modelsToTest = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-2.1',
    'claude-2.0'
  ]

  const results: any[] = []

  for (const model of modelsToTest) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: 'Hi'
          }]
        }),
      })

      if (response.ok) {
        const data = await response.json()
        results.push({
          model,
          works: true,
          response: data.content[0]?.text
        })
        break // Found working model
      } else {
        const errorText = await response.text()
        results.push({
          model,
          works: false,
          status: response.status,
          error: errorText.substring(0, 150)
        })
      }
    } catch (error: any) {
      results.push({
        model,
        works: false,
        error: error.message
      })
    }
  }

  return NextResponse.json({
    apiKeyPrefix: apiKey.substring(0, 10) + '...',
    results
  })
}
