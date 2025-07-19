import { RateLimiter } from './types.ts'

export class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number

  constructor(tokensPerSecond = 10) {
    this.maxTokens = tokensPerSecond
    this.refillRate = tokensPerSecond
    this.tokens = tokensPerSecond
    this.lastRefill = Date.now()
  }

  async acquire(): Promise<void> {
    while (true) {
      this.refillTokens()

      if (this.tokens >= 1) {
        this.tokens--
        return
      }

      const waitTime = (1 / this.refillRate) * 1000
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  private refillTokens(): void {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    const tokensToAdd = elapsed * this.refillRate
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefill = now
  }
}

