import { Auth, FormGuard } from '@decorator'
import { CreateFormThemeWithAIInput } from '@graphql'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormAIService, FormService } from '@service'

@Resolver()
@Auth()
export class CreateFormThemeWithAIResolver {
  constructor(
    private readonly formService: FormService,
    private readonly formAIService: FormAIService
  ) {}

  @Mutation(returns => Boolean)
  @FormGuard()
  async createFormThemeWithAI(
    @Args('input') input: CreateFormThemeWithAIInput
  ): Promise<boolean> {
    const theme = await this.formAIService.generateTheme(input.prompt, input.theme)

    return this.formService.update(input.formId, {
      themeSettings: {
        theme
      }
    })
  }
}
