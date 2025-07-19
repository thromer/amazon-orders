import { Fetcher, FetchResponse } from '../lib/types.ts'

export class MockFetcher implements Fetcher {
  private responses: FetchResponse[]
  private requestIndex = 0
  private requestHistory: string[] = []

  constructor(responses: FetchResponse[]) {
    this.responses = responses
  }

  async fetch(url: string): Promise<FetchResponse> {
    this.requestHistory.push(url)
    
    const response = this.responses[this.requestIndex++]
    if (!response) {
      throw new Error(`No mock response available for request ${this.requestIndex} (${url})`)
    }
    
    return response
  }

  getRequestHistory(): string[] {
    return [...this.requestHistory]
  }

  reset(): void {
    this.requestIndex = 0
    this.requestHistory = []
  }
}
