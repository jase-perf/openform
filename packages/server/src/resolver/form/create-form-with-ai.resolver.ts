import {
  CaptchaKindEnum,
  FormKindEnum,
  FormStatusEnum,
  InteractiveModeEnum
} from '@heyform-inc/shared-types-enums'

import { Auth, ProjectGuard, Team, User } from '@decorator'
import { CreateFormWithAIInput } from '@graphql'
import { TeamModel, UserModel } from '@model'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { FormAIService, FormService } from '@service'

import { aiFieldsToFormFields } from './ai-field-mapper'

@Resolver()
@Auth()
export class CreateFormWithAIResolver {
  constructor(
    private readonly formService: FormService,
    private readonly formAIService: FormAIService
  ) {}

  @Mutation(returns => String)
  @ProjectGuard()
  async createFormWithAI(
    @Team() team: TeamModel,
    @User() user: UserModel,
    @Args('input') input: CreateFormWithAIInput
  ): Promise<string> {
    const generated = await this.formAIService.generateFormFields(input.topic, input.reference)
    const fields = aiFieldsToFormFields(generated, { includeThankYou: true })

    return await this.formService.create({
      teamId: team.id,
      projectId: input.projectId,
      memberId: user.id,
      name: input.topic.trim().slice(0, 80) || 'Untitled',
      interactiveMode: InteractiveModeEnum.GENERAL,
      kind: FormKindEnum.SURVEY,
      fields: [],
      _drafts: JSON.stringify(fields),
      fieldsUpdatedAt: 0,
      settings: {
        active: false,
        captchaKind: CaptchaKindEnum.NONE,
        filterSpam: false,
        allowArchive: true,
        requirePassword: false,
        locale: 'en',
        enableQuestionList: true,
        enableNavigationArrows: true,
        enableEmailNotification: true
      },
      hiddenFields: [],
      version: 0,
      status: FormStatusEnum.NORMAL
    })
  }
}
