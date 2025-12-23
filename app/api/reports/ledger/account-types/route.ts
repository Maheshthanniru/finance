import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const transactions = await getTransactions()
    const filtered = transactions.filter(t => {
      if (fromDate && t.date < fromDate) return false
      if (toDate && t.date > toDate) return false
      return true
    })

    // Group by account type
    const accountTypes: { [key: string]: { credit: number; debit: number } } = {}
    
    filtered.forEach(t => {
      const accountType = t.accountName.split(' ')[0] // Simple extraction
      if (!accountTypes[accountType]) {
        accountTypes[accountType] = { credit: 0, debit: 0 }
      }
      accountTypes[accountType].credit += t.credit
      accountTypes[accountType].debit += t.debit
    })

    const result = Object.entries(accountTypes).map(([accountType, totals]) => ({
      accountType,
      credit: totals.credit,
      debit: totals.debit,
      balance: totals.credit - totals.debit,
    }))

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch account types' }, { status: 500 })
  }
}

