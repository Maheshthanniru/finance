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
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase environment variables are missing!')
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.'
      }, { status: 500 })
    }

    const transaction: Transaction = await request.json()
    await saveTransaction(transaction)
    return NextResponse.json({ success: true, transaction })
  } catch (error: any) {
    console.error('Error saving transaction:', error)
    return NextResponse.json({ 
      error: 'Failed to save transaction',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

