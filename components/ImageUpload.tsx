'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, Edit2 } from 'lucide-react'

interface ImageUploadProps {
  imageUrl?: string
  onUpload: (file: File) => Promise<string>
  onDelete?: () => Promise<void>
  label: string
  loanId: string
  imageType: 'customer' | 'guarantor1' | 'guarantor2' | 'partner'
  className?: string
}

export default function ImageUpload({
  imageUrl,
  onUpload,
  onDelete,
  label,
  loanId,
  imageType,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(imageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when imageUrl prop changes (when loan is selected)
  useEffect(() => {
    setPreview(imageUrl || null)
  }, [imageUrl])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      const url = await onUpload(file)
      setPreview(url)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
      setPreview(imageUrl || null)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      await onDelete()
      setPreview(null)
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image. Please try again.')
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:border-blue-500 transition-colors">
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt={label}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
              <button
                onClick={handleClick}
                disabled={uploading}
                className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-opacity disabled:opacity-50"
                title="Change image"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Edit2 className="w-4 h-4" />
                )}
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={uploading}
                  className="opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-opacity disabled:opacity-50"
                  title="Delete image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleClick}
            disabled={uploading}
            className="w-full h-48 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 mb-2" />
            )}
            <span className="text-sm font-medium">{uploading ? 'Uploading...' : label}</span>
            <span className="text-xs text-gray-400 mt-1">Click to upload</span>
          </button>
        )}
      </div>
    </div>
  )
}







