import { NextRequest, NextResponse } from 'next/server'
import { getLoans } from '@/lib/data'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loans = await getLoans()
    const partnerLoans = loans.filter(loan => loan.partnerId === params.id)
    return NextResponse.json(partnerLoans)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch partner loans' }, { status: 500 })
  }
}

