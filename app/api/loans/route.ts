import { NextRequest, NextResponse } from 'next/server'
import { getLoans, saveLoan, deleteLoan } from '@/lib/data'
import { Loan } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { 
          error: 'Supabase not configured',
          message: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const number = searchParams.get('number')
    
    let loans = await getLoans()
    
    if (type) {
      loans = loans.filter(loan => loan.loanType === type)
    }
    
    if (number) {
      loans = loans.filter(loan => loan.number.toString() === number || `${loan.loanType}-${loan.number}` === number)
    }
    
    return NextResponse.json(loans)
  } catch (error) {
    console.error('Error in GET /api/loans:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch loans',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
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

    const loan: Loan = await request.json()
    await saveLoan(loan)
    return NextResponse.json({ success: true, loan })
  } catch (error: any) {
    console.error('Error saving loan:', error)
    return NextResponse.json({ 
      error: 'Failed to save loan',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Loan ID is required' }, { status: 400 })
    }
    await deleteLoan(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 })
  }
}

