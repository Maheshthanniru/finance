import { NextRequest, NextResponse } from 'next/server'
import { getDailyReport } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const report = await getDailyReport(date)
    return NextResponse.json(report)
  } catch (error: any) {
    console.error('Error in daily report API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch daily report',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

