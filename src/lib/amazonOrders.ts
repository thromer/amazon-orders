import { AmazonOrders, OrderHistoryOptions, OrderHistoryResult, OrderSummary, OrderDetail } from '../types/public.ts'
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
      new OrderSummaryImpl(this, "123", "https://TODO")
      return {
	orders: {
	  [Symbol.asyncIterator]: async function* () {}
	}
      }
    } catch (error) {
      throw new Error(`Failed to get order numbers: ${error instanceof Error ? error.message : error}`)
    }
  }

  async getOrder(_: string): Promise<OrderDetail> {
    return OrderDetail{}  // TODO fill in the fields ...
  }
}

class OrderSummaryImpl implements OrderSummary {
  private client: AmazonOrdersImpl
  public readonly orderNumber: string
  private invoiceUrl: string
  constructor(client: AmazonOrdersImpl, orderNumber: string, invoiceUrl: string) {
    this.client = client
    this.orderNumber = orderNumber
    this.invoiceUrl = invoiceUrl
  }
  getDetail(): Promise<OrderDetail> { 
    return this.client.getOrderDetail(this.invoiceUrl)
  }
}
