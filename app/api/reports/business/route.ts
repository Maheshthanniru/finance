import { NextRequest, NextResponse } from 'next/server'
import { getLoans } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')
    const partner = searchParams.get('partner')

    const loans = await getLoans()
    const filtered = loans.filter(loan => {
      if (fromDate && loan.date < fromDate) return false
      if (toDate && loan.date > toDate) return false
      if (partner && loan.partnerName !== partner) return false
      return true
    })

    // Group by partner
    const partnerBusiness: { [key: string]: any } = {}
    
    filtered.forEach(loan => {
      const partnerName = loan.partnerName || 'Unknown'
      if (!partnerBusiness[partnerName]) {
        partnerBusiness[partnerName] = {
          totalLoan: 0,
          totalPaid: 0,
          actualLoan: 0,
          actualPaid: 0,
        }
      }
      partnerBusiness[partnerName].totalLoan += loan.loanAmount
      partnerBusiness[partnerName].actualLoan += loan.loanAmount
      // Paid amount would come from transactions
    })

    const totalBusiness = Object.entries(partnerBusiness).map(([partnerName, data]) => ({
      partnerName,
      totalLoan: data.totalLoan,
      totalPaid: data.totalPaid,
      balanceWith: data.totalLoan - data.totalPaid,
      actualLoan: data.actualLoan,
      actualPaid: data.actualPaid,
      balanceWithout: data.actualLoan - data.actualPaid,
    }))

    const generalBusiness = filtered.map(loan => ({
      date: loan.date,
      number: `${loan.loanType}-${loan.number}`,
      name: loan.customerName,
      loan: loan.loanAmount,
      paid: 0, // Would be calculated from transactions
      balance: loan.loanAmount,
    }))

    const outstanding = filtered.map(loan => ({
      date: loan.date,
      dueDate: loan.dueDate || loan.date,
      number: `${loan.loanType}-${loan.number}`,
      loan: loan.loanAmount,
      paid: 0,
      balance: loan.loanAmount,
      days: 0, // Would be calculated
    }))

    const mdDetails = partner ? {
      name: partner,
      actualLoan: partnerBusiness[partner]?.actualLoan || 0,
      actualPaid: partnerBusiness[partner]?.actualPaid || 0,
      actualBalance: (partnerBusiness[partner]?.actualLoan || 0) - (partnerBusiness[partner]?.actualPaid || 0),
      totalLoan: partnerBusiness[partner]?.totalLoan || 0,
      totalPaid: partnerBusiness[partner]?.totalPaid || 0,
      totalBalance: (partnerBusiness[partner]?.totalLoan || 0) - (partnerBusiness[partner]?.totalPaid || 0),
    } : null

    return NextResponse.json({
      totalBusiness,
      generalBusiness,
      outstanding,
      mdDetails,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch business details' }, { status: 500 })
  }
}

