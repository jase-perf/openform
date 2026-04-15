import * as assert from 'assert'

import { FieldKindEnum } from '@heyform-inc/shared-types-enums'

import { aiFieldsToFormFields } from '../src/resolver/form/ai-field-mapper'
import { FormAIService } from '../src/service/form-ai.service'

function testNormalizeFieldsAcceptsValidShape() {
  const svc = new FormAIService()
  const out = svc.normalizeFields([
    { title: 'Age?', kind: 'number' },
    { title: 'Subscribe', kind: 'multiple_choice', choices: ['Yes', 'No'] },
    { title: '', kind: 'short_text' }, // dropped (empty title)
    null,
    { title: 'Plain note', kind: 'not_a_kind' } // falls back to short_text
  ] as any)

  assert.strictEqual(out.length, 3)
  assert.strictEqual(out[0].kind, 'number')
  assert.deepStrictEqual(out[1].choices, ['Yes', 'No'])
  assert.strictEqual(out[2].kind, 'short_text')
}

function testNormalizeFieldsHandlesChoiceObjects() {
  const svc = new FormAIService()
  const out = svc.normalizeFields([
    { title: 'Colors', kind: 'multiple_choice', choices: [{ label: 'Red' }, { label: 'Blue' }] }
  ] as any)
  assert.deepStrictEqual(out[0].choices, ['Red', 'Blue'])
}

function testAIFieldsToFormFieldsAttachesMultipleChoiceProperties() {
  const fields = aiFieldsToFormFields(
    [
      {
        title: 'Favorite color?',
        kind: FieldKindEnum.MULTIPLE_CHOICE,
        choices: ['Red', 'Green', 'Blue']
      }
    ],
    { includeThankYou: true }
  )
  assert.strictEqual(fields.length, 2)
  assert.strictEqual(fields[0].kind, FieldKindEnum.MULTIPLE_CHOICE)
  assert.strictEqual(fields[0].properties?.choices.length, 3)
  assert.deepStrictEqual(
    fields[0].properties?.choices.map((c: any) => c.label),
    ['Red', 'Green', 'Blue']
  )
  assert.strictEqual(fields[1].kind, FieldKindEnum.THANK_YOU)
}

function testAIFieldsToFormFieldsRatingHasShape() {
  const fields = aiFieldsToFormFields([{ title: 'Rate us', kind: FieldKindEnum.RATING }])
  assert.strictEqual(fields[0].properties?.shape, 'star')
  assert.strictEqual(fields[0].properties?.total, 5)
}

function run() {
  testNormalizeFieldsAcceptsValidShape()
  testNormalizeFieldsHandlesChoiceObjects()
  testAIFieldsToFormFieldsAttachesMultipleChoiceProperties()
  testAIFieldsToFormFieldsRatingHasShape()
}

if (require.main === module) {
  try {
    run()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exitCode = 1
  }
}
