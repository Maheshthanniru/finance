import { NextRequest, NextResponse } from 'next/server'
import { getPartners, savePartner, getNextPartnerId } from '@/lib/data'
import { Partner } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // Check if requesting next partner ID
    const searchParams = request.nextUrl.searchParams
    if (searchParams.get('nextId') === 'true') {
      const nextId = await getNextPartnerId()
      return NextResponse.json({ nextPartnerId: nextId })
    }
    
    const partners = await getPartners()
    return NextResponse.json(partners)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase environment variables are missing!')
      return NextResponse.json({ 
        error: 'Database not configured',
        message: 'Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.'
      }, { status: 500 })
    }

    const partner: Partner = await request.json()
    await savePartner(partner)
    return NextResponse.json({ success: true, partner })
  } catch (error: any) {
    console.error('Error saving partner:', error)
    return NextResponse.json({ 
      error: 'Failed to save partner',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const partner: Partner = await request.json()
    await savePartner(partner)
    return NextResponse.json({ success: true, partner })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }
    
    const { supabase } = await import('@/lib/supabase')
    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 })
  }
}

