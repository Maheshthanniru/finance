import { NextRequest, NextResponse } from 'next/server'
import { getLoans } from '@/lib/data'
import { NPALoan } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const partner = searchParams.get('partner')
    const aadhaar = searchParams.get('aadhaar')
    const name = searchParams.get('name')

    const loans = await getLoans()
    
    // Filter NPA loans (for now, we'll mark loans with due date passed as NPA)
    let npaLoans: NPALoan[] = loans
      .filter(loan => {
        // Only process loans with IDs (all loans from DB should have IDs)
        if (!loan.id) return false
        if (partner && loan.partnerName !== partner) return false
        if (aadhaar && !loan.aadhaar?.includes(aadhaar)) return false
        if (name && !loan.customerName.toLowerCase().includes(name.toLowerCase())) return false
        return true
      })
      .map(loan => ({
        id: loan.id!, // Non-null assertion safe because we filtered above
        date: loan.date,
        number: `${loan.loanType}-${loan.number}`,
        name: loan.customerName,
        npaAmount: loan.loanAmount * 0.1, // Example calculation
        aadhaar: loan.aadhaar,
        phone: loan.phone1,
        isNPA: true,
        npaDate: loan.date,
        loanType: loan.loanType,
        partnerName: loan.partnerName,
      }))

    return NextResponse.json(npaLoans)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch NPA loans' }, { status: 500 })
  }
}

