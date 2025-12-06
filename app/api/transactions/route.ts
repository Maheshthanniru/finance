import { NextRequest, NextResponse } from 'next/server'
import { getTransactions, saveTransaction } from '@/lib/data'
import { Transaction } from '@/types'

export async function GET() {
  try {
    const transactions = await getTransactions()
    return NextResponse.json(transactions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const transaction: Transaction = await request.json()
    await saveTransaction(transaction)
    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 })
  }
}

