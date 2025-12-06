import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountName = searchParams.get('accountName')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const transactions = await getTransactions()
    const filtered = transactions.filter(t => {
      if (accountName && t.accountName !== accountName) return false
      if (fromDate && t.date < fromDate) return false
      if (toDate && t.date > toDate) return false
      return true
    }).sort((a, b) => a.date.localeCompare(b.date))

    let runningBalance = 0
    const details = filtered.map(t => {
      runningBalance += t.credit - t.debit
      return {
        date: t.date,
        particulars: t.particulars,
        number: t.number || t.rno,
        credit: t.credit,
        debit: t.debit,
        balance: runningBalance,
      }
    })

    return NextResponse.json(details)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 })
  }
}

