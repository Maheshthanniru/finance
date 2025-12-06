import { NextRequest, NextResponse } from 'next/server'
import { getLoans, saveLoan } from '@/lib/data'

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { accountNumber, phone, guarantorPhone } = data
    
    // Find loan by account number
    const loans = await getLoans()
    const loan = loans.find(l => `${l.loanType}-${l.number}` === accountNumber)
    
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }
    
    // Update phone numbers
    if (phone) {
      loan.phone1 = phone
    }
    if (guarantorPhone && loan.guarantor1) {
      loan.guarantor1.phone = guarantorPhone
    }
    
    await saveLoan(loan)
    return NextResponse.json({ success: true, loan })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 })
  }
}

