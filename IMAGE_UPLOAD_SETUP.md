# Image Upload Setup Guide

This guide will help you set up image upload functionality using Supabase Storage.

## Prerequisites

1. Supabase project created and configured
2. Database schema run (from `supabase-schema.sql`)
3. Environment variables set in `.env.local`

## Step 1: Create Storage Bucket

The SQL schema includes commands to create the storage bucket, but you can also create it manually:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Set the following:
   - **Name**: `loan-images`
   - **Public bucket**: ✅ Enable (checked)
5. Click **Create bucket**

## Step 2: Verify Storage Policies

The SQL schema automatically creates storage policies, but verify they exist:

1. Go to **Storage** → **Policies** in your Supabase dashboard
2. Ensure the following policies exist for the `loan-images` bucket:
   - **Allow public read access to loan images** (SELECT)
   - **Allow authenticated users to upload loan images** (INSERT)
   - **Allow authenticated users to update loan images** (UPDATE)
   - **Allow authenticated users to delete loan images** (DELETE)

If policies are missing, you can run the storage policy section from `supabase-schema.sql` again.

## Step 3: Test Image Upload

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to a ledger page (e.g., `/reports/cd-ledger`)

3. Select a loan account

4. Click on the image upload area for "Loan Person" or "Surety Person"

5. Select an image file (max 5MB, image formats only)

6. The image should upload and display automatically

## Features

### Image Upload Component

The `ImageUpload` component provides:
- ✅ Drag-and-drop or click to upload
- ✅ Image preview
- ✅ Edit/Replace image functionality
- ✅ Delete image functionality
- ✅ Loading states during upload
- ✅ File validation (type and size)
- ✅ Automatic storage in Supabase Storage bucket

### Supported Image Types

- Customer/Loan Person image
- Guarantor 1/Surety Person image
- Guarantor 2 image
- Partner image

### File Requirements

- **File types**: Any image format (JPEG, PNG, GIF, WebP, etc.)
- **Max file size**: 5MB
- **Storage location**: Supabase Storage bucket `loan-images`

## API Endpoints

### Upload Image
```
POST /api/loans/[id]/images
Content-Type: multipart/form-data

Body:
- file: File
- imageType: 'customer' | 'guarantor1' | 'guarantor2' | 'partner'
```

### Delete Image
```
DELETE /api/loans/[id]/images?imageType=[type]
```

## Database Fields

The following fields are added to the `loans` table:
- `customer_image_url` - URL to customer/loan person image
- `guarantor1_image_url` - URL to guarantor 1/surety person image
- `guarantor2_image_url` - URL to guarantor 2 image
- `partner_image_url` - URL to partner image

## Troubleshooting

### Images not uploading
- Check that the storage bucket `loan-images` exists
- Verify storage policies are set correctly
- Check browser console for errors
- Ensure file size is under 5MB

### Images not displaying
- Verify the image URL is stored in the database
- Check that the storage bucket is set to public
- Verify the image file exists in Supabase Storage

### Permission errors
- Ensure RLS policies allow operations on the `loans` table
- Check storage policies allow INSERT/UPDATE/DELETE operations

## Security Notes

⚠️ **Important**: The current setup allows public read access to images. For production:

1. Consider making the bucket private and using signed URLs
2. Implement proper authentication/authorization
3. Add file type validation on the server side
4. Consider adding image compression/resizing
5. Implement rate limiting for uploads

## Next Steps

- Add image compression before upload
- Implement image cropping/resizing
- Add support for multiple images per loan
- Add image gallery view
- Implement image backup/export functionality




