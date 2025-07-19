#!/usr/bin/env node

import { readFileSync } from 'fs'
import { JSDOM } from 'jsdom'
import { parseInvoice } from '../index.ts'

async function main() {
  const htmlPath = process.argv[2]
  if (!htmlPath) {
    console.error('Usage: parse-invoice <htmlPath>')
    process.exit(1)
  }
    
  try {
    const orderDetail = parseInvoice(new JSDOM(readFileSync(htmlPath)).window.document)
    console.log(JSON.stringify(orderDetail, null, 2))
  } catch (e) {
    console.error('Error parsing invoice:', (e as Error).message)
    process.exit(1)
  }
}

main()
