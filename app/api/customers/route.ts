import { NextRequest, NextResponse } from 'next/server'

interface Customer {
  id: string
  customerId: number
  aadhaar?: string
  name: string
  father?: string
  address: string
  village?: string
  mandal?: string
  district?: string
  phone1?: string
  phone2?: string
}

// In-memory storage (replace with actual database)
let customers: Customer[] = []

export async function GET() {
  try {
    return NextResponse.json(customers)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const customer: Customer = await request.json()
    if (!customer.id) {
      customer.id = `customer-${Date.now()}`
    }
    customers.push(customer)
    return NextResponse.json({ success: true, customer })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save customer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const customer: Customer = await request.json()
    const index = customers.findIndex(c => c.id === customer.id)
    if (index >= 0) {
      customers[index] = customer
    }
    return NextResponse.json({ success: true, customer })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }
    customers = customers.filter(c => c.id !== id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}

