import { Auth, FormGuard } from '@decorator'
import { CreateFieldsWithAIInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormAIService, FormService } from '@service'

import { aiFieldsToFormFields } from './ai-field-mapper'

@Resolver()
@Auth()
export class CreateFieldsWithAIResolver {
  constructor(
    private readonly formService: FormService,
    private readonly formAIService: FormAIService
  ) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async createFieldsWithAI(@Args('input') input: CreateFieldsWithAIInput): Promise<boolean> {
    const generated = await this.formAIService.generateFieldsForPrompt(input.prompt)
    const newFields = aiFieldsToFormFields(generated)

    const form = await this.formService.findById(input.formId)
    const existing = Array.isArray(form?._drafts) ? form._drafts : []
    let parsed: any[] = []
    if (typeof form?._drafts === 'string' && form._drafts.length > 0) {
      try {
        parsed = JSON.parse(form._drafts)
      } catch {
        parsed = []
      }
    } else if (Array.isArray(existing)) {
      parsed = existing
    }

    const merged = [...parsed, ...newFields]
    return this.formService.update(input.formId, {
      _drafts: JSON.stringify(merged)
    })
  }
}
