import { NextRequest, NextResponse } from 'next/server'
import { getLoans } from '@/lib/data'
import { LoanSearchResult } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const aadhaar = searchParams.get('aadhaar')
    const name = searchParams.get('name')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const allLoans = await getLoans()

    // Filter loans
    let filteredLoans = allLoans.filter(loan => {
      if (aadhaar && loan.aadhaar !== aadhaar) return false
      if (name && !loan.customerName.toLowerCase().includes(name.toLowerCase())) return false
      if (fromDate && loan.date < fromDate) return false
      if (toDate && loan.date > toDate) return false
      return true
    })

    // Categorize loans
    const runningLoans = filteredLoans.filter(loan => {
      // Logic to determine if loan is running (not closed)
      return true // Simplified for now
    })

    const asGuarantor1 = filteredLoans.filter(loan => {
      // Logic to find loans where this person is guarantor 1
      return loan.guarantor1?.name?.toLowerCase().includes(name?.toLowerCase() || '')
    })

    const asGuarantor2 = filteredLoans.filter(loan => {
      // Logic to find loans where this person is guarantor 2
      return loan.guarantor2?.name?.toLowerCase().includes(name?.toLowerCase() || '')
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

