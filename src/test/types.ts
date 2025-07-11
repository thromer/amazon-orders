import { OrderHistoryOptions } from '../types/public.ts'
import { FetchResponse } from '../types/internal.ts'

export interface TestData {
  name: string
  description?: string
  input: OrderHistoryOptions
  expected: GetOrderNumbersResult
  mockResponses?: FetchResponse[]
}
