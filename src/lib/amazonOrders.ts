import { AmazonOrders, Currency, OrderHistoryOptions, OrderHistoryResult, OrderSummary, OrderDetail, schemaVersion } from '../index.ts'
import { HttpFetcher } from './httpFetcher.ts'
import { AmazonOrdersDependencies, Fetcher } from './types.ts'

// import { TokenBucketRateLimiter } from './rateLimiter.ts'

export class AmazonOrdersImpl implements AmazonOrders {
  private fetcher: Fetcher

  constructor(dependencies: AmazonOrdersDependencies = {
    fetcher: new HttpFetcher()
  }) {
    this.fetcher = dependencies.fetcher;
  }

  async getOrderHistory(options: OrderHistoryOptions): Promise<OrderHistoryResult> {
    try {
      console.log('getOrderHistory')
      const response = await this.fetcher.fetch(`https://www.example.com/?start=${options.dateRange.start}&end=${options.dateRange.end}`)
      
      if (response.status !== 200) {
	throw new Error(`HTTP ${response.status}: Failed to fetch order numbers`)
      }
      new OrderSummaryImpl(this, "123", "https://www.example.com/order")
      return {
	orders: (async function*(): AsyncIterable<OrderSummary> {})()
      }
    } catch (error) {
      throw new Error(`Failed to get order numbers: ${error instanceof Error ? error.message : error}`)
    }
  }

  // TODO complain if subtotal != preTaxTotal
  async getOrder(url: string): Promise<OrderDetail> {
    console.log(`getOrder ${url}`)
    await this.fetcher.fetch(url)
    return {
      schemaVersion,
      date: new Date(),
      paymentMethod: "TODO",
      currency: Currency.USD,
      subtotal: 1729,
      tax: 172,
      preTaxTotal: 1729,
      grandTotal: 1729 + 172,
      shippingAndHandling: 0,
      discounts: [],
      items: [],
      shippingAddress: ["Somewhere"],
    }
  }
}

class OrderSummaryImpl implements OrderSummary {
  private client: AmazonOrdersImpl
  // TODO unclear whether we need orderNumber
  public readonly orderNumber: string
  private invoiceUrl: string
  constructor(client: AmazonOrdersImpl, orderNumber: string, invoiceUrl: string) {
    this.client = client
    this.orderNumber = orderNumber
    this.invoiceUrl = invoiceUrl
  }
  getDetail(): Promise<OrderDetail> { 
    return this.client.getOrder(this.invoiceUrl)
  }
}
