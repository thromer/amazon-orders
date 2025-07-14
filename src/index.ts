import { AmazonOrdersImpl } from './lib/amazonOrders.ts'
import { InvoiceParser } from './lib/invoiceParser.ts'

export interface AmazonOrders {
  getOrderHistory(options: OrderHistoryOptions): Promise<OrderHistoryResult>
  getOrder(orderNumber: string): Promise<OrderDetail>
}

export function createAmazonOrders(): AmazonOrders {
  return new AmazonOrdersImpl()
}

export function parseInvoice(document: Document) : OrderDetail {
  return new InvoiceParser().parseInvoice(document)
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

export const schemaVersion = "0.1.0"

export enum Currency {
  USD,
}

export interface OrderDetail {
  schemaVersion: string
  date: Date
  paymentMethod: string
  currency: Currency
  subtotal: number
  tax: number
  preTaxTotal: number
  grandTotal: number
  shippingAndHandling: number
  discounts: Array<{ description: string; amount: number }>
  items: ItemDetail[]
  shippingAddress: Array<string>
  finalized?: boolean
}

export interface ItemDetail {
  description: string
  seller?: string
  supplier?: string
  quantity: number
  itemPrice: number
  // expectedDeliveryDate?: Date
  // actualDeliveryDate?: Date
  // shippingDate?: Date
}

