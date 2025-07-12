export interface FetchResponse {
  status: number
  json: () => Promise<any>
  text: () => Promise<string>
}

export interface AmazonOrdersDependencies {
  fetcher: Fetcher
}

export interface Fetcher {
  fetch(url: string): Promise<FetchResponse>
}

export interface RateLimiter {
  acquire(): Promise<void>
}

