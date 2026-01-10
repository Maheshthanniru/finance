import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

const BUCKET_NAME = 'loan-images' // Using existing bucket

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseClient()
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
    const fileName = `guarantors/${params.id}/photo-${Date.now()}.${fileExt}`

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

    // Check if guarantor exists first
    const { data: existingGuarantor, error: checkError } = await supabase
      .from('guarantors')
      .select('id')
      .eq('id', params.id)
      .single()

    if (checkError || !existingGuarantor) {
      console.error('Guarantor not found:', params.id, checkError)
      // Try to delete the uploaded file if guarantor doesn't exist
      await supabase.storage.from(BUCKET_NAME).remove([fileName])
      return NextResponse.json({ 
        error: 'Guarantor not found. Please save guarantor first before uploading image.' 
      }, { status: 404 })
    }

    // Update guarantor record with image URL
    const { error: updateError } = await supabase
      .from('guarantors')
      .update({ image_url: imageUrl })
      .eq('id', params.id)

    if (updateError) {
      console.error('Update error:', updateError)
      // Try to delete the uploaded file if update fails
      await supabase.storage.from(BUCKET_NAME).remove([fileName])
      return NextResponse.json({ 
        error: `Failed to update guarantor record: ${updateError.message || 'Unknown error'}` 
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
    const supabase = getSupabaseClient()
    // Get current image URL from database
    const { data: guarantor, error: fetchError } = await supabase
      .from('guarantors')
      .select('image_url')
      .eq('id', params.id)
      .single()

    if (fetchError || !guarantor) {
      return NextResponse.json({ error: 'Guarantor not found' }, { status: 404 })
    }

    const imageUrl = guarantor.image_url
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 404 })
    }

    // Extract file path from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts.slice(-3).join('/') // Get guarantors/guarantorId/filename

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      // Continue to update database even if storage delete fails
    }

    // Update guarantor record to remove image URL
    const { error: updateError } = await supabase
      .from('guarantors')
      .update({ image_url: null })
      .eq('id', params.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update guarantor record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
