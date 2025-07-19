import { OrderHistoryOptions, OrderHistoryResult, OrderSummary } from '../index.ts'
import { FetchResponse } from '../lib/types.ts'

export interface TestData {
  // name: string
  // description?: string
  input: JsonOrderHistoryOptions
  expected: SyncOrderHistoryResult
  mockResponses?: FetchResponse[]  // TODO map from request to response
}

export interface JsonOrderHistoryOptions extends Omit<OrderHistoryOptions, 'dateRange'> {
  dateRange: {
    start: string
    end: string
  }
}

export interface SyncOrderHistoryResult extends Omit<OrderHistoryResult, 'orders'> {
  orders: Array<OrderSummary>
}

export function createOrderHistoryOptions(j: JsonOrderHistoryOptions) {
  return { ...j, dateRange: { start: new Date(j.dateRange.start), end: new Date(j.dateRange.end) } }
}
