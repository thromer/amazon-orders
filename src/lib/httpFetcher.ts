import { Fetcher, FetchResponse /*, RateLimiter */ } from '../types/internal.ts'

export class HttpFetcher implements Fetcher {
  // private rateLimiter: RateLimiter

  constructor(
    // rateLimiter: RateLimiter
  ) {
    // this.rateLimiter = rateLimiter
  }

  async fetch(url: string): Promise<FetchResponse> {
    // await this.rateLimiter.acquire()
    // const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`
    // const controller = new AbortController()
    // const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    
    try {
      const response = await fetch(url, {
        // signal: controller.signal
      })
      
      return {
        status: response.status,
        json: async () => response.json(),
        text: async () => response.text()
      }
    } catch (error) {
      //      if (error instanceof DOMException && error.name === 'AbortError') {
      //        throw new Error(`Request timeout after ${this.timeout}ms`)
      //      }
      throw error
    } finally {
      // clearTimeout(timeoutId)
    }
  }
}
