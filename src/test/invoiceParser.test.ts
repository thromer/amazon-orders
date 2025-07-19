import { expect, test } from 'vitest'

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { JSDOM } from 'jsdom'
import { parseInvoice } from '../index.ts'

const fixturesDir = join(__dirname, 'fixtures', 'parseInvoice')
const testCases = readdirSync(fixturesDir)

testCases.forEach((testCase) => {
  const testDir = join(fixturesDir, testCase)
  test(testCase, async () => {
    let testData
    try {
      testData = JSON.parse(
	readFileSync(join(testDir, 'test.json'), 'utf-8')
      )
    } catch (error) {
      throw new Error(`Failed to parse test fixture ${testCase}: ${(error as Error).message}`)
    }
    const invoicePath = join(testDir, testData.html)
    const actual = parseInvoice(new JSDOM(readFileSync(invoicePath)).window.document)
    expect(actual).toEqual(testData.expected)
  })
})
