import { NextRequest, NextResponse } from 'next/server'
import { getLoans } from '@/lib/data'
import { Installment } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loans = await getLoans()
    const loan = loans.find(l => l.id === params.id)
    
    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }
    
    // Generate installments based on loan details
    const installments: Installment[] = []
    if (loan.loanType === 'STBD' || loan.loanType === 'HP') {
      const installmentAmount = (loan.loanAmount || 0) / (loan.period || 1)
      const loanDate = new Date(loan.date)
      
      for (let i = 0; i < (loan.period || 0); i++) {
        const dueDate = new Date(loanDate)
        dueDate.setMonth(dueDate.getMonth() + i)
        
        installments.push({
          sn: i + 1,
          dueDate: dueDate.toISOString().split('T')[0],
          installmentAmount,
          paidAmount: 0,
          dueAmount: installmentAmount,
          dueDays: 0,
          penalty: 0,
        })
      }
    }
    
    return NextResponse.json(installments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch installments' }, { status: 500 })
  }
}

