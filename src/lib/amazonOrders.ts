import { OrderHistoryOptions, OrderHistoryResult, OrderSummary } from '../types/public.ts'
import { AmazonOrdersDependencies } from '../types/internal.ts'
import { HttpFetcher } from './httpFetcher.ts'
import { Fetcher } from '../types/internal.ts'

// import { TokenBucketRateLimiter } from './rateLimiter.ts'

export class AmazonOrdersImpl implements AmazonOrders {
  private fetcher: Fetcher

  constructor(dependencies: AmazonOrdersDependencies={
    fetcher: new HttpFetcher()}) {
      this.fetcher = dependencies.fetcher;
    }

  async getOrderHistory(options: OrderHistoryOptions): Promise<OrderHistoryResult> {
    try {
      const response = await this.fetcher.fetch(`https://TODO${options.dateRange.start}${options.dateRange.end}`)
      
      if (response.status !== 200) {
	throw new Error(`HTTP ${response.status}: Failed to fetch order numbers`)
      }
      return {
	orders: {
	  [Symbol.asyncIterator]: async function* () {}
	}
      }
    } catch (error) {
      throw new Error(`Failed to get order numbers: ${error instanceof Error ? error.message : error}`)
    }
  }
}


class OrderSummaryImpl implements OrderSummary {
  private client: AmazonOrders
  public readonly orderNumber: string
  private invoiceUrl: string
  constructor(client: AmazonOrders, orderNumber: string, invoiceUrl: string) {
    this.client = client
    this.orderNumber = orderNumber
    this.invoiceUrl = invoiceUrl
  }
  getOrderDetails(): Promise<OrderDetail> { 
    return this.client.getOrderDetails(this.invoiceUrl)
  }
}
