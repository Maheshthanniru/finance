import { NextRequest, NextResponse } from 'next/server'
import { getLoans, getTransactions } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const partner = searchParams.get('partner')
    const fromDate = searchParams.get('fromDate') || '2017-05-01'
    const toDate = searchParams.get('toDate') || new Date().toISOString().split('T')[0]

    const allLoans = await getLoans()
    const allTransactions = await getTransactions()

    // Filter loans by partner and date
    let filteredLoans = allLoans.filter(loan => {
      if (partner && loan.partnerName !== partner) return false
      if (loan.date < fromDate || loan.date > toDate) return false
      return true
    })

    // Calculate partner performance metrics
    const partnerPerformance = {
      totalLoans: filteredLoans.length,
      totalLoanAmount: filteredLoans.reduce((sum, loan) => sum + loan.loanAmount, 0),
      totalPaid: 0, // This would be calculated from transactions
      commission: 0,
      documentCharges: filteredLoans.reduce((sum, loan) => sum + (loan.documentCharges || 0), 0),
      penalty: 0, // This would be calculated from transactions/ledger
    }

    // Calculate commission (example: 2% of loan amount)
    partnerPerformance.commission = partnerPerformance.totalLoanAmount * 0.02

    return NextResponse.json({
      partnerPerformance,
      loans: filteredLoans,
      fromDate,
      toDate,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch partner performance' }, { status: 500 })
  }
}

