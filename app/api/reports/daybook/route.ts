import { NextRequest, NextResponse } from 'next/server'
import { getDayBook } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const dayBook = await getDayBook(date)
    return NextResponse.json(dayBook)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch day book' }, { status: 500 })
  }
}

