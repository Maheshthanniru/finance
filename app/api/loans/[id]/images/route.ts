import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const BUCKET_NAME = 'loan-images'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('imageType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!imageType) {
      return NextResponse.json({ error: 'Image type is required' }, { status: 400 })
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
    const fileName = `${params.id}/${imageType}-${Date.now()}.${fileExt}`

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

    // Update loan record with image URL
    const fieldName = getImageFieldName(imageType)
    const { error: updateError } = await supabase
      .from('loans')
      .update({ [fieldName]: imageUrl })
      .eq('id', params.id)

    if (updateError) {
      console.error('Update error:', updateError)
      // Try to delete the uploaded file if update fails
      await supabase.storage.from(BUCKET_NAME).remove([fileName])
      return NextResponse.json({ error: 'Failed to update loan record' }, { status: 500 })
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
    const searchParams = request.nextUrl.searchParams
    const imageType = searchParams.get('imageType')

    if (!imageType) {
      return NextResponse.json({ error: 'Image type is required' }, { status: 400 })
    }

    // Get current image URL from database
    const { data: loan, error: fetchError } = await supabase
      .from('loans')
      .select(getImageFieldName(imageType))
      .eq('id', params.id)
      .single()

    if (fetchError || !loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
    }

    const imageUrl = loan[getImageFieldName(imageType) as keyof typeof loan] as string | null
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image to delete' }, { status: 404 })
    }

    // Extract file path from URL
    const urlParts = imageUrl.split('/')
    const fileName = urlParts.slice(-2).join('/') // Get loanId/filename

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      // Continue to update database even if storage delete fails
    }

    // Update loan record to remove image URL
    const fieldName = getImageFieldName(imageType)
    const { error: updateError } = await supabase
      .from('loans')
      .update({ [fieldName]: null })
      .eq('id', params.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update loan record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getImageFieldName(imageType: string): string {
  const mapping: { [key: string]: string } = {
    customer: 'customer_image_url',
    guarantor1: 'guarantor1_image_url',
    guarantor2: 'guarantor2_image_url',
    partner: 'partner_image_url',
  }
  return mapping[imageType] || 'customer_image_url'
}


