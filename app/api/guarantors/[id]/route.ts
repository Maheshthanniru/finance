import { NextRequest, NextResponse } from 'next/server'
import { getGuarantors, saveGuarantor } from '@/lib/data'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guarantors = await getGuarantors()
    const guarantor = guarantors.find(g => g.id === params.id)
    
    if (!guarantor) {
      return NextResponse.json({ error: 'Guarantor not found' }, { status: 404 })
    }
    
    return NextResponse.json(guarantor)
  } catch (error) {
    console.error('Error fetching guarantor:', error)
    return NextResponse.json({ error: 'Failed to fetch guarantor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guarantor = await request.json()
    guarantor.id = params.id // Ensure ID matches route parameter
    await saveGuarantor(guarantor)
    
    // Fetch updated guarantor
    const guarantors = await getGuarantors()
    const updatedGuarantor = guarantors.find(g => g.id === params.id)
    
    if (!updatedGuarantor) {
      return NextResponse.json({ error: 'Guarantor not found after update' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, guarantor: updatedGuarantor })
  } catch (error: any) {
    console.error('Error updating guarantor:', error)
    return NextResponse.json({ 
      error: 'Failed to update guarantor',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}
