import { NextRequest, NextResponse } from 'next/server'
import { getLoans } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromDate = searchParams.get('fromDate') || '2013-04-25'
    const toDate = searchParams.get('toDate') || new Date().toISOString().split('T')[0]
    const partner = searchParams.get('partner')

    const allLoans = await getLoans()

    // Filter loans by date range
    let filteredLoans = allLoans.filter(loan => {
      if (loan.date < fromDate || loan.date > toDate) return false
      if (partner && loan.partnerName !== partner) return false
      return true
    })

    // Get unique customers (by name and aadhaar combination)
    const uniqueCustomers = new Map<string, any>()
    
    filteredLoans.forEach(loan => {
      // Skip loans without IDs (shouldn't happen for DB loans, but defensive check)
      if (!loan.id) return
      
      const key = `${loan.customerName}-${loan.aadhaar || ''}`
      if (!uniqueCustomers.has(key)) {
        uniqueCustomers.set(key, {
          id: loan.id, // Safe now because we checked above
          customerName: loan.customerName,
          fatherName: loan.fatherName,
          aadhaar: loan.aadhaar,
          address: loan.address,
          phone1: loan.phone1,
          phone2: loan.phone2,
          firstLoanDate: loan.date,
          firstLoanNumber: `${loan.loanType}-${loan.number}`,
          firstLoanAmount: loan.loanAmount,
          totalLoans: 1,
          totalLoanAmount: loan.loanAmount,
        })
      } else {
        const customer = uniqueCustomers.get(key)!
        customer.totalLoans += 1
        customer.totalLoanAmount += loan.loanAmount
        if (loan.date < customer.firstLoanDate) {
          customer.firstLoanDate = loan.date
          customer.firstLoanNumber = `${loan.loanType}-${loan.number}`
          customer.firstLoanAmount = loan.loanAmount
        }
      }
    })

    const customers = Array.from(uniqueCustomers.values())
      .sort((a, b) => new Date(a.firstLoanDate).getTime() - new Date(b.firstLoanDate).getTime())

    return NextResponse.json({
      customers,
      total: customers.length,
      fromDate,
      toDate,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch new customers' }, { status: 500 })
  }
}

