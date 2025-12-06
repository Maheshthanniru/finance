import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/data'

export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const transactions = await getTransactions()
    // Filter transactions for this account
    // This would need to match accountId to loan number or account name
    const accountTransactions = transactions.filter(t => 
      t.number === params.accountId || t.rno === params.accountId
    )
    
    return NextResponse.json(accountTransactions.map(t => ({
      date: t.date,
      credit: t.credit,
      debit: t.debit,
      particulars: t.particulars,
    })))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 })
  }
}

