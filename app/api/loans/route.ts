import { NextRequest, NextResponse } from 'next/server'
import { getLoans, saveLoan, deleteLoan } from '@/lib/data'
import { Loan } from '@/types'

export async function GET(request: NextRequest) {
  try {
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
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const loan: Loan = await request.json()
    await saveLoan(loan)
    return NextResponse.json({ success: true, loan })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save loan' }, { status: 500 })
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

