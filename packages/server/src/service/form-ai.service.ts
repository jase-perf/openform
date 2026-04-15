import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { OpenAI } from 'openai'

import { OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_GPT_MODEL } from '@environments'
import { helper } from '@heyform-inc/utils'

export interface AIGeneratedField {
  title: string
  description?: string
  kind: string
  choices?: string[]
}

export interface AIGeneratedTheme {
  questionTextColor?: string
  answerTextColor?: string
  backgroundColor?: string
  buttonBackground?: string
  buttonTextColor?: string
  fontFamily?: string
}

interface CompletionArgs {
  systemPrompt: string
  userPrompt: string
  maxTokens?: number
}

const SUPPORTED_KINDS = new Set([
  'welcome',
  'thank_you',
  'statement',
  'short_text',
  'long_text',
  'number',
  'yes_no',
  'multiple_choice',
  'opinion_scale',
  'rating',
  'date',
  'email',
  'url',
  'phone_number',
  'full_name',
  'address',
  'legal_terms'
])

@Injectable()
export class FormAIService {
  private readonly logger = new Logger(FormAIService.name)

  private client(): OpenAI {
    if (!OPENAI_API_KEY) {
      throw new ServiceUnavailableException(
        'AI features are not configured on this server. Set OPENAI_API_KEY.'
      )
    }
    return new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: OPENAI_BASE_URL
    })
  }

  private async complete({ systemPrompt, userPrompt, maxTokens = 1500 }: CompletionArgs): Promise<string> {
    const { choices } = await this.client().chat.completions.create({
      model: OPENAI_GPT_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: maxTokens,
      top_p: 1,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })

    const content = choices?.[0]?.message?.content
    if (!helper.isValid(content)) {
      throw new ServiceUnavailableException('AI service returned an empty response')
    }
    return content as string
  }

  private safeParse<T>(raw: string): T {
    try {
      return JSON.parse(raw) as T
    } catch (err) {
      this.logger.error(`AI JSON parse failed: ${(err as Error).message}. Raw: ${raw.slice(0, 300)}`)
      throw new ServiceUnavailableException('AI service returned malformed JSON')
    }
  }

  public normalizeFields(raw: unknown): AIGeneratedField[] {
    if (!Array.isArray(raw)) return []
    return raw
      .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
      .map(f => {
        const kind = String(f.kind ?? 'short_text').toLowerCase()
        const title = String(f.title ?? '').trim()
        if (!title) return null
        const description =
          typeof f.description === 'string' && f.description.trim() ? f.description.trim() : undefined
        const rawChoices = Array.isArray(f.choices) ? f.choices : []
        const choices = rawChoices
          .map(c => (typeof c === 'string' ? c.trim() : typeof c === 'object' && c ? String((c as any).label ?? '').trim() : ''))
          .filter(Boolean)
        return {
          title,
          description,
          kind: SUPPORTED_KINDS.has(kind) ? kind : 'short_text',
          choices: choices.length > 0 ? choices : undefined
        }
      })
      .filter(f => f !== null) as AIGeneratedField[]
  }

  public async generateFormFields(topic: string, reference?: string): Promise<AIGeneratedField[]> {
    const system = [
      'You design concise online survey forms. Return strictly a JSON object with a single key "fields".',
      '"fields" is an array of 5 to 10 items. Each item has:',
      '- title: string question',
      '- kind: one of [short_text, long_text, number, yes_no, multiple_choice, opinion_scale, rating, email, url, phone_number, date]',
      '- description (optional): short helper text',
      '- choices (optional): array of short strings; required when kind is multiple_choice',
      'Do not invent other keys. Do not return markdown.'
    ].join('\n')

    const user = reference
      ? `Topic: ${topic}\n\nReference material:\n${reference}`
      : `Topic: ${topic}`

    const raw = await this.complete({ systemPrompt: system, userPrompt: user, maxTokens: 1500 })
    const parsed = this.safeParse<{ fields?: unknown }>(raw)
    return this.normalizeFields(parsed?.fields)
  }

  public async generateFieldsForPrompt(prompt: string): Promise<AIGeneratedField[]> {
    return this.generateFormFields(prompt)
  }

  public async generateTheme(prompt: string, existingTheme?: string): Promise<AIGeneratedTheme> {
    const system = [
      'Return strictly a JSON object describing a form theme. Keys (all optional, all strings, CSS hex colors unless noted):',
      'questionTextColor, answerTextColor, backgroundColor, buttonBackground, buttonTextColor, fontFamily (plain font-family name).',
      'No markdown. No prose.'
    ].join('\n')

    const user = existingTheme
      ? `Prompt: ${prompt}\n\nExisting theme JSON:\n${existingTheme}`
      : `Prompt: ${prompt}`

    const raw = await this.complete({ systemPrompt: system, userPrompt: user, maxTokens: 400 })
    const parsed = this.safeParse<AIGeneratedTheme>(raw)
    return parsed || {}
  }
}
