import { AmazonOrdersImpl } from '../lib/amazonOrders.ts'

export interface AmazonOrders {
  getOrderHistory(options: OrderHistoryOptions): Promise<OrderHistoryResult>
  getOrder(orderNumber: string): Promise<OrderDetail>  
}

export function createAmazonOrders(): AmazonOrders {
  return new AmazonOrdersImpl()
}

export interface OrderHistoryOptions {
  dateRange: {
    start: Date
    end: Date
  }
}

export interface OrderHistoryResult {
  orders: AsyncIterable<OrderSummary>
}

export interface OrderSummary {
  orderNumber: string
  getDetail(): Promise<OrderDetail>
}

export interface OrderDetail {
  date: Date
  paymentMethod: string
  currency: string
  subtotal: number
  tax: number
  preTaxTotal: number
  grandTotal: number
  shippingAndHandling: number
  discounts: Array<{ description: string; amount: number }>
  items: ItemDetail[]
  shippingAddress: string
  finalized?: boolean
}

export interface ItemDetail {
  description: string
  seller: string
  supplier: string
  quantity: number
  itemPrice: number
  expectedDeliveryDate?: Date
  actualDeliveryDate?: Date
  shippingDate?: Date
}
