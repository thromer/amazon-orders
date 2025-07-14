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
    
    // Validate amounts are non-negative
    this.validateNonNegative('Item(s) Subtotal:', subtotal)
    this.validateNonNegative('Estimated tax to be collected:', tax)
    this.validateNonNegative('Total before tax:', preTaxTotal)
    this.validateNonNegative('Grand Total:', grandTotal)
    this.validateNonNegative('Shipping & Handling:', shippingAndHandling)
    
    // Validate calculations
    const discountSum = discounts.reduce((sum, discount) => sum + discount.amount, 0)
    const expectedPreTaxTotal = subtotal + shippingAndHandling + discountSum
    const expectedGrandTotal = tax + preTaxTotal
    
    if (Math.abs(preTaxTotal - expectedPreTaxTotal) > 0.01) {
      throw new InvoiceParserError(
        `Total before tax validation failed: expected ${expectedPreTaxTotal.toFixed(2)}, got ${preTaxTotal.toFixed(2)}`
      )
    }
    
    if (Math.abs(grandTotal - expectedGrandTotal) > 0.01) {
      throw new InvoiceParserError(
        `Grand total validation failed: expected ${expectedGrandTotal.toFixed(2)}, got ${grandTotal.toFixed(2)}`
      )
    }
    
    return {
      schemaVersion,
      date: this.parseOrderDate(doc),
      paymentMethod: this.parsePaymentMethod(doc),
      currency: Currency.USD,
      subtotal,
      tax,
      preTaxTotal,
      grandTotal,
      shippingAndHandling,
      discounts,
      items: this.parseItems(doc),
      shippingAddress: this.parseShippingAddress(doc)
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
          const amount = parseFloat(amountText.replace(/[$,]/g, ''))
          if (!isNaN(amount)) {
            if (amount < 0) {
              // Negative amounts are discounts
              discounts.push({ description: label, amount })
            } else {
              // Positive amounts go to the amounts map
              amounts.set(label, amount)
            }
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

  private validateNonNegative(label: string, amount: number): void {
    if (amount < 0) {
      throw new InvoiceParserError(`Amount for "${label}" must be non-negative, got ${amount}`)
    }
  }

  private parseOrderDate(doc: Document): Date {
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

  private parsePaymentMethod(doc: Document): string {
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

  private parseShippingAddress(doc: Document): Array<string> {
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

  private parseItems(doc: Document): ItemDetail[] {
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
      const itemPrice = parseFloat(priceText.replace(/[$,]/g, ''))
      if (isNaN(itemPrice)) {
        throw new InvoiceParserError(`Item price not parseable as float: ${priceText}`)
      }
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
