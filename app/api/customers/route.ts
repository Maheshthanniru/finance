import { NextRequest, NextResponse } from 'next/server'
import { getCustomers, saveCustomer } from '@/lib/data'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET() {
  try {
    const customers = await getCustomers()
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
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

    const customer = await request.json()
    await saveCustomer(customer)
    
    // Fetch the saved customer to get the ID
    const savedCustomers = await getCustomers()
    const savedCustomer = savedCustomers.find(
      c => c.customerId === customer.customerId
    )
    
    if (!savedCustomer) {
      console.error('Customer saved but not found in fetch:', customer)
      return NextResponse.json({ 
        error: 'Customer saved but could not retrieve ID',
        customer: customer 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      customer: savedCustomer,
      id: savedCustomer.id // Explicitly include ID for easier access
    })
  } catch (error: any) {
    console.error('Error saving customer:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to save customer' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const customer = await request.json()
    await saveCustomer(customer) // Upsert handles both create and update
    return NextResponse.json({ success: true, customer })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}

