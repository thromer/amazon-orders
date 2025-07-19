import { describe, expect, test } from 'vitest'

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { AmazonOrdersImpl } from '../lib/amazonOrders.ts'
import { MockFetcher } from './mockFetcher.ts'
import { TestData, createOrderHistoryOptions } from './types.ts'

const fixturesDir = join(__dirname, 'fixtures', 'getOrderNumbers')
const testCases = readdirSync(fixturesDir)

testCases.forEach((testCase) => {
  const testDir = join(fixturesDir, testCase)
  test(testCase, async () => {
    let testData: TestData
    try {
      testData = JSON.parse(
	readFileSync(join(testDir, 'test.json'), 'utf-8')
      )
    } catch (error) {
      throw new Error(`Failed to parse test fixture ${testCase}: ${(error as Error).message}`)
    }
    const amazonOrders = new AmazonOrdersImpl({
      fetcher: new MockFetcher(testData.mockResponses || [])})
    const result = await amazonOrders.getOrderHistory(createOrderHistoryOptions(testData.input))
    const syncResult = { ...result, orders: await Array.fromAsync(result.orders) }
    expect(syncResult).toEqual(testData.expected)
  })
})

describe('getOrderNumbers', () => {
  test('should handle empty response', async () => {
    const mockResponse = {
      status: 200,
      json: async () => ({ orders: [], total: 0, has_more: false }),
      text: async () => ''
    }
    
    const amazonOrders = new AmazonOrdersImpl({
      fetcher: new MockFetcher([mockResponse])})
    const result = await amazonOrders.getOrderHistory({dateRange: {start: new Date(), end: new Date()}})
    const syncResult = { ...result, orders: await Array.fromAsync(result.orders) }
    expect(syncResult.orders).toHaveLength(0)
  })
  
  test('should handle HTTP errors', async () => {
    const mockResponse = {
      status: 500,
      json: async () => ({}),
      text: async () => 'Internal Server Error'
    }
    
    const amazonOrders = new AmazonOrdersImpl({
      fetcher: new MockFetcher([mockResponse])})
    await expect(amazonOrders.getOrderHistory({dateRange: {start: new Date(), end: new Date()}})).rejects.toThrow(
      'HTTP 500: Failed to fetch order numbers'
    )
  })
})
