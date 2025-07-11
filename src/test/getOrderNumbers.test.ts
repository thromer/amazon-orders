import { describe, expect, test } from 'vitest'

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { getOrderNumbers } from '../lib/getOrderNumbers.ts'
import { MockFetcher } from './mockFetcher.ts'
import { TestData } from './types.ts'

const fixturesDir = join(__dirname, 'fixtures', 'getOrderNumbers')
const testCases = readdirSync(fixturesDir)

testCases.forEach((testCase) => {
  const testDir = join(fixturesDir, testCase)
  test(testCase, async () => {
    const testData: TestData = JSON.parse(
      readFileSync(join(testDir, 'test.json'), 'utf-8')
    )
    const mockFetcher = new MockFetcher(testData.mockResponses || [])
    const result = await getOrderNumbers(testData.input, mockFetcher)
    expect(result).toEqual(testData.expected)
  })
})

describe('getOrderNumbers', () => {
  test('should handle empty response', async () => {
    const mockResponse = {
      status: 200,
      json: async () => ({ orders: [], total: 0, has_more: false }),
      text: async () => ''
    }
    
    const mockFetcher = new MockFetcher([mockResponse])
    const result = await getOrderNumbers({}, mockFetcher)
    
    expect(result.orders).toHaveLength(0)
    expect(result.total).toBe(0)
    expect(result.hasMore).toBe(false)
  })
  
  test('should handle HTTP errors', async () => {
    const mockResponse = {
      status: 500,
      json: async () => ({}),
      text: async () => 'Internal Server Error'
    }
    
    const mockFetcher = new MockFetcher([mockResponse])
    
    await expect(getOrderNumbers({}, mockFetcher)).rejects.toThrow(
      'HTTP 500: Failed to fetch order numbers'
    )
  })
})
