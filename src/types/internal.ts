export interface FetchResponse {
  status: number
  json: () => Promise<any>
  text: () => Promise<string>
}

export interface AmazonOrdersDependencies {
  fetcher: Fetcher
}
o
export interface Fetcher {
  fetch(url: string): Promise<FetchResponse>
}

export interface RateLimiter {
  acquire(): Promise<void>
}

