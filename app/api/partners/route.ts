import { NextRequest, NextResponse } from 'next/server'
import { getPartners, savePartner } from '@/lib/data'
import { Partner } from '@/types'

export async function GET() {
  try {
    const partners = await getPartners()
    return NextResponse.json(partners)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const partner: Partner = await request.json()
    await savePartner(partner)
    return NextResponse.json({ success: true, partner })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save partner' }, { status: 500 })
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
    const { searchParams } = new URL(request.url)
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

