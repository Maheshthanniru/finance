import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountType = searchParams.get('accountType')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const transactions = await getTransactions()
    const filtered = transactions.filter(t => {
      if (accountType && !t.accountName.includes(accountType)) return false
      if (fromDate && t.date < fromDate) return false
      if (toDate && t.date > toDate) return false
      return true
    })

    const accounts: { [key: string]: { credit: number; debit: number } } = {}
    
    filtered.forEach(t => {
      if (!accounts[t.accountName]) {
        accounts[t.accountName] = { credit: 0, debit: 0 }
      }
      accounts[t.accountName].credit += t.credit
      accounts[t.accountName].debit += t.debit
    })

    const result = Object.entries(accounts).map(([aName, totals]) => ({
      aName,
      credit: totals.credit,
      debit: totals.debit,
      balance: totals.credit - totals.debit,
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

