import { expect, test } from 'vitest'

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

import { JSDOM } from 'jsdom'
import { parseInvoice } from '../index.ts'

const fixturesDir = join(__dirname, 'fixtures', 'parseInvoice')
const testCases = readdirSync(fixturesDir)

testCases.forEach((testCase) => {
  const testDir = join(fixturesDir, testCase)
  test(testCase, async () => {
    const testData = JSON.parse(
      readFileSync(join(testDir, 'test.json'), 'utf-8')
    )
    const invoicePath = join(testDir, testData.html)
    const actual = parseInvoice(new JSDOM(readFileSync(invoicePath)).window.document)
    expect(actual).toEqual(testData.expected)
  })
})
