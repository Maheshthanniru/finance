import { NextRequest, NextResponse } from 'next/server'
import { getLoans } from '@/lib/data'
import { LoanSearchResult } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const aadhaar = searchParams.get('aadhaar')
    const name = searchParams.get('name')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const allLoans = await getLoans()

    // Filter loans - check aadhaar in customer, guarantor1, or guarantor2
    let filteredLoans = allLoans.filter(loan => {
      // If searching by aadhaar, check customer, guarantor1, or guarantor2
      if (aadhaar) {
        const matchesAadhaar = 
          loan.aadhaar === aadhaar ||
          loan.guarantor1?.aadhaar === aadhaar ||
          loan.guarantor2?.aadhaar === aadhaar
        if (!matchesAadhaar) return false
      }
      
      // If searching by name, check customer name
      if (name && !loan.customerName.toLowerCase().includes(name.toLowerCase())) return false
      
      // Date filters
      if (fromDate && loan.date < fromDate) return false
      if (toDate && loan.date > toDate) return false
      
      return true
    })

    // Categorize loans
    const runningLoans = filteredLoans.filter(loan => {
      // Logic to determine if loan is running (not closed)
      return true // Simplified for now
    })

    const asGuarantor1 = allLoans.filter(loan => {
      // Apply date filters first
      if (fromDate && loan.date < fromDate) return false
      if (toDate && loan.date > toDate) return false
      
      // Find loans where this person is guarantor 1 (by aadhaar or name)
      if (aadhaar && loan.guarantor1?.aadhaar === aadhaar) return true
      if (name && loan.guarantor1?.name?.toLowerCase().includes(name.toLowerCase())) return true
      return false
    })

    const asGuarantor2 = allLoans.filter(loan => {
      // Apply date filters first
      if (fromDate && loan.date < fromDate) return false
      if (toDate && loan.date > toDate) return false
      
      // Find loans where this person is guarantor 2 (by aadhaar or name)
      if (aadhaar && loan.guarantor2?.aadhaar === aadhaar) return true
      if (name && loan.guarantor2?.name?.toLowerCase().includes(name.toLowerCase())) return true
      return false
    })

    const result: LoanSearchResult = {
      runningLoans,
      asGuarantor1,
      asGuarantor2,
      allLoans: filteredLoans,
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to search loans' }, { status: 500 })
  }
}

