import * as assert from 'assert'

import { resolveRemoveBranding } from '../src/service/form.service'

function testEnvForcesRemoval() {
  assert.strictEqual(resolveRemoveBranding(true, null), true)
  assert.strictEqual(resolveRemoveBranding(true, undefined), true)
  assert.strictEqual(resolveRemoveBranding(true, { removeBranding: false }), true)
}

function testTeamToggleRespectedWhenEnvUnset() {
  assert.strictEqual(resolveRemoveBranding(false, { removeBranding: true }), true)
  assert.strictEqual(resolveRemoveBranding(false, { removeBranding: false }), false)
  assert.strictEqual(resolveRemoveBranding(false, {}), false)
  assert.strictEqual(resolveRemoveBranding(false, null), false)
}

function run() {
  testEnvForcesRemoval()
  testTeamToggleRespectedWhenEnvUnset()
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
