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

    const accounts: { [key: string]: { credit: number; debit: number } } = {}
    
    filtered.forEach(t => {
      if (!accounts[t.accountName]) {
        accounts[t.accountName] = { credit: 0, debit: 0 }
      }
      accounts[t.accountName].credit += t.credit
      accounts[t.accountName].debit += t.debit
    })

    const accountBalances = Object.entries(accounts).map(([name, totals]) => ({
      name,
      cBalance: totals.credit,
      dBalance: totals.debit,
    }))

    const creditTotal = filtered.reduce((sum, t) => sum + t.credit, 0)
    const debitTotal = filtered.reduce((sum, t) => sum + t.debit, 0)
    const openingCashBalance = 0
    const closingCashBalance = creditTotal - debitTotal
    const capital = 37517282 // This would be calculated from capital transactions
    const grandTotal = closingCashBalance + capital
    const shareValue = grandTotal / 4 // Assuming 4 partners

    return NextResponse.json({
      accounts: accountBalances,
      creditTotal,
      debitTotal,
      openingCashBalance,
      closingCashBalance,
      capital,
      grandTotal,
      shareValue,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch final statement' }, { status: 500 })
  }
}

