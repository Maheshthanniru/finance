'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Loader2, Edit2, Camera } from 'lucide-react'

interface CustomerImageUploadProps {
  imageUrl?: string
  onUpload: (file: File) => Promise<string>
  onDelete?: () => Promise<void>
  label?: string
  customerId?: string
  className?: string
  resetTrigger?: number // Add reset trigger prop
}

export default function CustomerImageUpload({
  imageUrl,
  onUpload,
  onDelete,
  label = 'Customer Photo',
  customerId,
  className = '',
  resetTrigger,
}: CustomerImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(imageUrl || null)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update preview when imageUrl prop changes
  useEffect(() => {
    if (imageUrl) {
      setPreview(imageUrl)
    } else {
      setPreview(null)
    }
  }, [imageUrl])

  // Reset camera when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      stopCamera()
      setPreview(null)
    }
  }, [resetTrigger])

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      setCameraReady(false)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false
      })
      
      streamRef.current = stream
      setShowCamera(true)
      
      // Wait for next render to ensure video element exists
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream
          
          // Wait for video metadata to load
          const handleLoadedMetadata = () => {
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  setCameraReady(true)
                })
                .catch(err => {
                  console.error('Error playing video:', err)
                  alert('Unable to start camera preview. Please try again.')
                  stopCamera()
                })
            }
          }
          
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
          
          // Handle video errors
          videoRef.current.onerror = (err) => {
            console.error('Video error:', err)
            alert('Error displaying camera preview. Please try again.')
            stopCamera()
          }
        }
      }, 50)
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please ensure camera permissions are granted.')
      setShowCamera(false)
      setCameraReady(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
    setCameraReady(false)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to capture photo')
          return
        }

        // Create File from blob
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        
        // Stop camera
        stopCamera()
        
        // Process and upload
        await processFile(file)
      }, 'image/jpeg', 0.9)
    }
  }

  const processFile = async (file: File) => {
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

    // Upload file automatically
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

  const handleCameraClick = () => {
    if (showCamera) {
      stopCamera()
    } else {
      startCamera()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {showCamera ? (
        <div className="relative border-2 border-orange-500 rounded-lg overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
            style={{ 
              backgroundColor: '#111827',
              minHeight: '256px',
              display: cameraReady ? 'block' : 'none'
            }}
          />
          {!cameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-white text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4 flex items-center justify-center gap-4">
            <button
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={capturePhoto}
              disabled={uploading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Capture
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:border-orange-500 transition-colors">
          {preview ? (
            <div className="relative group">
              <img
                src={preview}
                alt={label}
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                <button
                  onClick={handleCameraClick}
                  disabled={uploading}
                  className="opacity-0 group-hover:opacity-100 bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 transition-opacity disabled:opacity-50"
                  title="Take new photo"
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
            <div className="w-full h-48 flex flex-col items-center justify-center">
              <button
                onClick={handleCameraClick}
                disabled={uploading}
                className="w-full h-full flex flex-col items-center justify-center text-gray-500 hover:text-orange-600 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-12 h-12 animate-spin mb-3 text-orange-500" />
                    <span className="text-sm font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 mb-3 text-orange-500" />
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-gray-400 mt-1">Click to capture photo</span>
                  </>
                )}
              </button>
              {!uploading && (
                <button
                  onClick={handleFileButtonClick}
                  className="mt-2 px-4 py-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
                >
                  Or select from device
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

