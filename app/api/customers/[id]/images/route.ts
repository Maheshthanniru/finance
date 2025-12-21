import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BUCKET_NAME = 'loan-images' // Using existing bucket, or create 'customer-images' if preferred

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `customers/${params.id}/photo-${Date.now()}.${fileExt}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // Check if customer exists first
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', params.id)
      .single()

    if (checkError || !existingCustomer) {
      console.error('Customer not found:', params.id, checkError)
      // Try to delete the uploaded file if customer doesn't exist
      await supabase.storage.from(BUCKET_NAME).remove([fileName])
      return NextResponse.json({ 
        error: 'Customer not found. Please save customer first before uploading image.' 
      }, { status: 404 })
    }

    // Update customer record with image URL
    const { error: updateError } = await supabase
      .from('customers')
      .update({ image_url: imageUrl })
      .eq('id', params.id)

    if (updateError) {
      console.error('Update error:', updateError)
      // Try to delete the uploaded file if update fails
      await supabase.storage.from(BUCKET_NAME).remove([fileName])
      return NextResponse.json({ 
        error: `Failed to update customer record: ${updateError.message || 'Unknown error'}` 
      }, { status: 500 })
    }

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current image URL from database
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('image_url')
      .eq('id', params.id)
      .single()

    if (fetchError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const imageUrl = customer.image_url
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 404 })
    }

    // Extract file path from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts.slice(-3).join('/') // Get customers/customerId/filename

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      // Continue to update database even if storage delete fails
    }

    // Update customer record to remove image URL
    const { error: updateError } = await supabase
      .from('customers')
      .update({ image_url: null })
      .eq('id', params.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update customer record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

