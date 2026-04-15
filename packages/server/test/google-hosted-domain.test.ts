import * as assert from 'assert'

import { emailMatchesHostedDomain } from '../src/service/social-login.service'

function testEmptyDomainAllowsAnyEmail() {
  assert.strictEqual(emailMatchesHostedDomain('anyone@example.com', ''), true)
  assert.strictEqual(emailMatchesHostedDomain(undefined, ''), true)
}

function testMatchingDomainAccepts() {
  assert.strictEqual(emailMatchesHostedDomain('alice@example.com', 'example.com'), true)
  assert.strictEqual(emailMatchesHostedDomain('BOB@Example.COM', 'EXAMPLE.com'), true)
}

function testNonMatchingDomainRejects() {
  assert.strictEqual(emailMatchesHostedDomain('alice@other.com', 'example.com'), false)
  assert.strictEqual(emailMatchesHostedDomain('alice@sub.example.com', 'example.com'), false)
  assert.strictEqual(emailMatchesHostedDomain('alice@example.company', 'example.com'), false)
  assert.strictEqual(emailMatchesHostedDomain('', 'example.com'), false)
  assert.strictEqual(emailMatchesHostedDomain(undefined, 'example.com'), false)
}

function run() {
  testEmptyDomainAllowsAnyEmail()
  testMatchingDomainAccepts()
  testNonMatchingDomainRejects()
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
