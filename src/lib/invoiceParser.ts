import { OrderDetail, ItemDetail, Currency, schemaVersion } from '../index.js'

export class InvoiceParserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvoiceParserError'
  }
}

export class InvoiceParser {
  private amountMap: Map<string, number> = new Map()

  parseInvoice(doc: Document): OrderDetail {
    const { amounts, discounts } = this.parseAmounts(doc)
    this.amountMap = amounts
    
    const subtotal = this.getAmount('Item(s) Subtotal:')
    const tax = this.getAmount('Estimated tax to be collected:')
    const preTaxTotal = this.getAmount('Total before tax:')
    const grandTotal = this.getAmount('Grand Total:')
    const shippingAndHandling = this.getAmount('Shipping & Handling:')
    const items = InvoiceParser.parseItems(doc)

    const detail = {
      schemaVersion,
      date: InvoiceParser.parseOrderDate(doc),
      paymentMethod: InvoiceParser.parsePaymentMethod(doc),
      currency: Currency.USD,
      subtotal,
      tax,
      preTaxTotal,
      grandTotal,
      shippingAndHandling,
      discounts,
      items,
      shippingAddress: InvoiceParser.parseShippingAddress(doc)
    }
    InvoiceParser.validateOrderDetail(detail)
    return detail
  }
  private static validateOrderDetail(detail: OrderDetail) {
    const itemsTotal = detail.items.reduce((sum, item) => sum + (item.itemPrice * item.quantity), 0)
    if (itemsTotal !== detail.subtotal) {
      throw new InvoiceParserError(
        `Items total != subtotal: expected ${InvoiceParser.milliDollarsToString(detail.subtotal)}, got ${InvoiceParser.milliDollarsToString(itemsTotal)}`
      )
    }
    const discountSum = detail.discounts.reduce((sum, discount) => sum + discount.amount, 0)
    const expectedPreTaxTotal = detail.subtotal + detail.shippingAndHandling + discountSum
    const expectedGrandTotal = detail.tax + detail.preTaxTotal
    if (detail.preTaxTotal !== expectedPreTaxTotal) {
      throw new InvoiceParserError(
        `preTaxTotal != subtotal + shippingAndHandling + discounts: expected ${InvoiceParser.milliDollarsToString(expectedPreTaxTotal)}, got ${InvoiceParser.milliDollarsToString(detail.preTaxTotal)}`
      )
    }
    if (detail.grandTotal !== expectedGrandTotal) {
      throw new InvoiceParserError(
        `grandTotal != tax + preTaxTotal: expected ${InvoiceParser.milliDollarsToString(expectedGrandTotal)}, got ${InvoiceParser.milliDollarsToString(detail.grandTotal)}`
      )
    }
  }

  private parseAmounts(doc: Document): { amounts: Map<string, number>, discounts: Array<{ description: string; amount: number }> } {
    const amounts = new Map<string, number>()
    const discounts: Array<{ description: string; amount: number }> = []
    
    const rows = doc.querySelectorAll('.od-line-item-row')
    for (const row of rows) {
      const labelElement = row.querySelector('.od-line-item-row-label')
      const amountElement = row.querySelector('.od-line-item-row-content')
      if (labelElement && amountElement) {
        const label = labelElement.textContent?.trim()
        const amountText = amountElement.textContent?.trim()
        if (label && amountText) {
          const amountInMilliDollars = InvoiceParser.parseAmountToMilliDollars(amountText)
          if (amountInMilliDollars < 0) {
            // Negative amounts are discounts
            discounts.push({ description: label, amount: amountInMilliDollars })
          } else {
            // Non-negative amounts go to the amounts map
	    if (amounts.has(label)) {
	      throw new InvoiceParserError(`Multiple occurrences of ${label}`)
	    }
            amounts.set(label, amountInMilliDollars)
          }
        }
      }
    }
    return { amounts, discounts }
  }

  private getAmount(label: string): number {
    const amount = this.amountMap.get(label)
    if (amount === undefined) {
      throw new InvoiceParserError(`Amount for "${label}" not found`)
    }
    return amount
  }

  private static parseAmountToMilliDollars(amountText: string): number {
    const cleanText = amountText.replace(/[$,]/g, '')
    const formatRegex = /^-?\d+\.\d{2}$/
    if (!formatRegex.test(cleanText)) {
      throw new InvoiceParserError(`Amount "${amountText}" does not match required format (must end with .XX)`)
    }
    const dollarAmount = parseFloat(cleanText)
    if (isNaN(dollarAmount)) {
      throw new InvoiceParserError(`Amount "${amountText}" is not a valid number`)
    }
    return Math.round(dollarAmount * 1000)
  }

  private static milliDollarsToString(milliDollars: number): string {
    return `${(milliDollars / 1000).toFixed(2)}`
  }

  private static parseOrderDate(doc: Document): Date {
    const dateElement = doc.querySelector('[data-component="orderDate"]')
    if (!dateElement) {
      throw new InvoiceParserError('Order date element not found')
    }
    const dateText = dateElement.textContent?.trim()
    if (!dateText) {
      throw new InvoiceParserError('Order date text not found')
    }
    const date = new Date(`${dateText} UTC`)
    if (isNaN(date.valueOf())) {
      throw new InvoiceParserError(`Invalid date: ${dateText}`)
    }
    return date
  }

  private static parsePaymentMethod(doc: Document): string {
    const paymentElement = doc.querySelector('.pmts-payments-instrument-detail-box-paystationpaymentmethod')
    if (!paymentElement) {
      throw new InvoiceParserError('Payment method element not found')
    }
    const paymentText = paymentElement.textContent?.trim()
    if (!paymentText) {
      throw new InvoiceParserError('Payment method text not found')
    }
    return paymentText.replace(/\s+/g, ' ')
  }

  private static parseShippingAddress(doc: Document): Array<string> {
    const addressElement = doc.querySelector('[data-component="shippingAddress"]')
    if (!addressElement) {
      throw new InvoiceParserError('Shipping address element not found')
    }
    const addressText = addressElement.textContent?.trim()
    if (!addressText) {
      throw new InvoiceParserError('Shipping address text not found')
    }
    const lines = addressText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line !== 'Ship to')
    if (lines.length === 0) {
      throw new InvoiceParserError('No shipping address lines found')
    }
    return lines
  }

  private static parseItems(doc: Document): ItemDetail[] {
    const items: ItemDetail[] = []
    const itemElements = doc.querySelectorAll('[data-component="purchasedItems"] .a-fixed-left-grid')
    
    for (const itemElement of itemElements) {
      const titleElement = itemElement.querySelector('[data-component="itemTitle"] a')
      const sellerElement = itemElement.querySelector('[data-component="orderedMerchant"] span')
      const supplierElement = itemElement.querySelector('[data-component="supplierOfRecord"] span')
      const priceElement = itemElement.querySelector('[data-component="unitPrice"] .a-offscreen')
      
      const description = titleElement?.textContent?.trim()
      if (!description) {
        throw new InvoiceParserError('Item description not found')
      }
      const sellerText = sellerElement?.textContent?.replace(/\s+/g, ' ').trim()
      const seller = sellerText?.replace(/^Sold by:\s*/, '').trim()
      const supplierText = supplierElement?.textContent?.replace(/\s+/g, ' ').trim()
      const supplier = supplierText?.replace(/^Supplied by:\s*/, '').trim()
      const priceText = priceElement?.textContent?.trim()
      if (!priceText) {
        throw new InvoiceParserError('Item price not found')
      }
      const itemPrice = InvoiceParser.parseAmountToMilliDollars(priceText)
      const quantityElement = itemElement.querySelector('.od-item-view-qty span')
      const quantityText = quantityElement?.textContent?.trim()
      let quantity = 1
      if (quantityText && quantityText !== '') {
        quantity = parseInt(quantityText, 10)
        if (isNaN(quantity)) {
          throw new InvoiceParserError(`Item quantity not parseable as integer: ${quantityText}`)
        }
      }
      const item: ItemDetail = {
        description,
        quantity,
        itemPrice
      }
      if (seller) {
        item.seller = seller
      }
      if (supplier) {
        item.supplier = supplier
      }
      items.push(item)
    }

    return items
  }
}
