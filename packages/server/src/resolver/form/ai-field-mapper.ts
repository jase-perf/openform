import { FieldKindEnum } from '@heyform-inc/shared-types-enums'
import { nanoid } from '@heyform-inc/utils'

import { AIGeneratedField } from '../../service/form-ai.service'

export interface MappedField {
  id: string
  title: string[] | null
  description: string[] | null
  kind: string
  validations?: { required?: boolean }
  properties?: Record<string, any>
  layout?: Record<string, any>
}

interface MapperOptions {
  includeThankYou?: boolean
}

const CHOICE_KINDS = new Set<string>([FieldKindEnum.MULTIPLE_CHOICE, FieldKindEnum.PICTURE_CHOICE])

function richText(value: string | undefined): string[] | null {
  if (!value) return null
  // HeyForm stores title/description as a rich-text array; a plain string is
  // compatible with the client-side renderer's htmlUtils.parse fallback.
  return [value]
}

export function aiFieldsToFormFields(
  fields: AIGeneratedField[],
  options: MapperOptions = {}
): MappedField[] {
  const mapped: MappedField[] = fields.map(f => {
    const base: MappedField = {
      id: nanoid(12),
      title: richText(f.title),
      description: richText(f.description),
      kind: f.kind,
      validations: { required: false }
    }

    if (CHOICE_KINDS.has(f.kind) && f.choices?.length) {
      base.properties = {
        allowMultiple: false,
        choices: f.choices.map(label => ({ id: nanoid(8), label }))
      }
    }

    if (f.kind === FieldKindEnum.OPINION_SCALE || f.kind === FieldKindEnum.RATING) {
      base.properties = { total: 5, shape: 'star' }
    }

    return base
  })

  if (options.includeThankYou) {
    mapped.push({
      id: nanoid(12),
      title: ['Thank you!'],
      description: ['Thanks for completing this form.'],
      kind: FieldKindEnum.THANK_YOU
    })
  }

  return mapped
}
