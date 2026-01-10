'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import CustomerImageUpload from '@/components/CustomerImageUpload'

interface Guarantor {
  id?: string
  guarantorId: number
  aadhaar?: string
  name: string
  father?: string
  address: string
  village?: string
  mandal?: string
  district?: string
  phone1?: string
  phone2?: string
  imageUrl?: string
}

export default function NewGuarantorPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Guarantor>>({
    guarantorId: 1,
    name: '',
    address: '',
    aadhaar: '',
    father: '',
    village: '',
    mandal: '',
    district: '',
    phone1: '',
    phone2: '',
    imageUrl: '',
  })
  const [guarantors, setGuarantors] = useState<Guarantor[]>([])
  const [loading, setLoading] = useState(false)
  const [savingGuarantor, setSavingGuarantor] = useState(false)
  const [savedGuarantorId, setSavedGuarantorId] = useState<string | null>(null)
  const [resetImageTrigger, setResetImageTrigger] = useState(0)

  useEffect(() => {
    fetchGuarantors()
    fetchNextGuarantorId()
  }, [])

  const fetchNextGuarantorId = async () => {
    try {
      const response = await fetch('/api/guarantors?nextId=true')
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, guarantorId: data.nextGuarantorId || 1 }))
      }
    } catch (error) {
      console.error('Error fetching next guarantor ID:', error)
      // Fallback: calculate from existing guarantors
      if (guarantors.length > 0) {
        const maxGuarantorId = Math.max(...guarantors.map(g => g.guarantorId || 0), 0)
        setFormData(prev => ({ ...prev, guarantorId: maxGuarantorId + 1 }))
      }
    }
  }

  const fetchGuarantors = async () => {
    try {
      const response = await fetch('/api/guarantors')
      const data = await response.json()
      setGuarantors(data)
    } catch (error) {
      console.error('Error fetching guarantors:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        alert('Please enter Guarantor Name')
        return
      }
      
      if (!formData.address || !formData.address.trim()) {
        alert('Please enter Address')
        return
      }

      // Check if image needs to be uploaded (if it's a preview URL from before save)
      const isPreviewUrl = formData.imageUrl && formData.imageUrl.startsWith('data:image')
      let imageUrlToSave = formData.imageUrl
      
      setSavingGuarantor(true)
      
      // First save guarantor without image if it's a preview URL
      const dataToSave = {
        ...formData,
        imageUrl: isPreviewUrl ? undefined : formData.imageUrl, // Don't send preview URL
      }
      
      const response = await fetch('/api/guarantors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })
      
      if (response.ok) {
        const result = await response.json()
        const savedGuarantor = result.guarantor || result
        
        // Get the saved guarantor ID
        const guarantorId = savedGuarantor.id || result.id
        
        if (guarantorId) {
          setSavedGuarantorId(guarantorId)
          
          // If there's a preview image (data URL), upload it now
          if (isPreviewUrl && formData.imageUrl) {
            try {
              // Convert data URL to blob and create File
              const base64Data = formData.imageUrl.split(',')[1]
              const byteCharacters = atob(base64Data)
              const byteNumbers = new Array(byteCharacters.length)
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i)
              }
              const byteArray = new Uint8Array(byteNumbers)
              const blob = new Blob([byteArray], { type: 'image/jpeg' })
              const file = new File([blob], `guarantor-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
              
              const uploadFormData = new FormData()
              uploadFormData.append('file', file)
              
              const uploadResponse = await fetch(`/api/guarantors/${guarantorId}/images`, {
                method: 'POST',
                body: uploadFormData,
              })
              
              if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json()
                imageUrlToSave = uploadData.url
                console.log('Image uploaded successfully:', uploadData.url)
                alert('Guarantor and photo saved successfully!')
              } else {
                const errorData = await uploadResponse.json().catch(() => ({}))
                console.warn('Failed to upload image:', errorData.error || 'Unknown error')
                // Show warning but don't fail the entire save
                alert(`Guarantor saved successfully, but image upload failed: ${errorData.error || 'Unknown error'}`)
              }
            } catch (error: any) {
              console.error('Error uploading image after save:', error)
              // Show warning but don't fail the entire save
              alert(`Guarantor saved successfully, but image upload failed: ${error.message || 'Unknown error'}`)
            }
          } else {
            alert('Guarantor saved successfully!')
          }
        } else {
          alert('Guarantor saved successfully!')
        }
        
        // Reset form for new entry
        await fetchGuarantors()
        await fetchNextGuarantorId()
        setResetImageTrigger(prev => prev + 1) // Reset image upload component
        setFormData(prev => ({ 
          ...prev,
          name: '',
          address: '',
          aadhaar: '',
          father: '',
          village: '',
          mandal: '',
          district: '',
          phone1: '',
          phone2: '',
          imageUrl: '',
          id: undefined
        }))
        setSavedGuarantorId(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || 'Error saving guarantor'
        console.error('Save error response:', errorData)
        alert(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error saving guarantor:', error)
      alert('Error saving guarantor')
    } finally {
      setSavingGuarantor(false)
    }
  }

  const handleReset = async () => {
    await fetchNextGuarantorId()
    setResetImageTrigger(prev => prev + 1) // Reset image upload component
    setFormData(prev => ({ 
      ...prev,
      name: '',
      address: '',
      aadhaar: '',
      father: '',
      village: '',
      mandal: '',
      district: '',
      phone1: '',
      phone2: '',
      imageUrl: '',
      id: undefined
    }))
    setSavedGuarantorId(null)
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    // If guarantor is already saved, upload image immediately
    if (savedGuarantorId) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      const response = await fetch(`/api/guarantors/${savedGuarantorId}/images`, {
        method: 'POST',
        body: uploadFormData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      const data = await response.json()
      // Update form data with image URL
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      return data.url
    } else {
      // If guarantor is not saved yet, create preview (data URL) for display
      // The image will be uploaded when guarantor is saved
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const previewUrl = reader.result as string
          setFormData(prev => ({ ...prev, imageUrl: previewUrl }))
          resolve(previewUrl)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
  }

  const handleImageDelete = async (): Promise<void> => {
    if (savedGuarantorId && formData.imageUrl && !formData.imageUrl.startsWith('data:')) {
      // Only call API if image is actually uploaded (not a preview)
      const response = await fetch(`/api/guarantors/${savedGuarantorId}/images`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }
    }
    
    // Remove from form data
    setFormData(prev => ({ ...prev, imageUrl: undefined }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="hover:bg-orange-600 p-2 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">New Guarantor Entry Form</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-red-600 border-b pb-2">Guarantor Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Guarantor ID: <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Auto-generated)</span>
                </label>
                <input
                  type="number"
                  value={formData.guarantorId || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Aadhaar:</label>
                <input
                  type="text"
                  value={formData.aadhaar || ''}
                  onChange={(e) => handleInputChange('aadhaar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter Aadhaar number"
                  maxLength={12}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Name: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Father:</label>
                <input
                  type="text"
                  value={formData.father || ''}
                  onChange={(e) => handleInputChange('father', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address: <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Village:</label>
                  <input
                    type="text"
                    value={formData.village || ''}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mandal:</label>
                  <input
                    type="text"
                    value={formData.mandal || ''}
                    onChange={(e) => handleInputChange('mandal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">District:</label>
                  <input
                    type="text"
                    value={formData.district || ''}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone 1:</label>
                  <input
                    type="tel"
                    value={formData.phone1 || ''}
                    onChange={(e) => handleInputChange('phone1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone 2:</label>
                  <input
                    type="tel"
                    value={formData.phone2 || ''}
                    onChange={(e) => handleInputChange('phone2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Guarantor Photo Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Guarantor Photo:
                </label>
                <CustomerImageUpload
                  imageUrl={formData.imageUrl}
                  onUpload={handleImageUpload}
                  onDelete={handleImageDelete}
                  label="Guarantor Photo"
                  customerId={savedGuarantorId || undefined}
                  className="w-full"
                  resetTrigger={resetImageTrigger}
                />
                {!savedGuarantorId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Photo will be saved when you save the guarantor record
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSave}
                disabled={savingGuarantor}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-md flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {savingGuarantor ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-md flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

