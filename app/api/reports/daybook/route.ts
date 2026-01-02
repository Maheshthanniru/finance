import { NextRequest, NextResponse } from 'next/server'
import { getDayBook } from '@/lib/data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const dayBook = await getDayBook(date)
    
    // Log for debugging
    console.log(`Day book for date ${date}:`, dayBook.length, 'entries')
    
    return NextResponse.json(dayBook)
  } catch (error: any) {
    console.error('Error in day book API:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch day book',
      details: error.message || error.toString()
    }, { status: 500 })
  }
}

