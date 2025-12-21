'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import CustomerImageUpload from '@/components/CustomerImageUpload'

interface Customer {
  id?: string
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
  imageUrl?: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Customer>>({
    customerId: 1,
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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [resetTrigger, setResetTrigger] = useState(0)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    // Set initial customerId based on existing customers
    if (customers.length > 0 && (!formData.customerId || formData.customerId === 1)) {
      const maxCustomerId = Math.max(...customers.map(c => c.customerId || 0), 0)
      if (maxCustomerId > 0) {
        setFormData(prev => ({ ...prev, customerId: maxCustomerId + 1 }))
      }
    }
  }, [customers])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        alert('Please enter Customer Name')
        return
      }
      
      if (!formData.address || !formData.address.trim()) {
        alert('Please enter Address')
        return
      }
      
      if (!formData.customerId || formData.customerId <= 0) {
        alert('Please enter a valid Customer ID')
        return
      }
      
      setSavingCustomer(true)
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        const savedCustomer = await response.json()
        const customerId = savedCustomer.customer?.id || savedCustomer.id
        
        // Image upload is handled separately via handleImageUpload
        
        alert('Customer saved successfully!')
        // Reset form for new entry
        const maxCustomerId = customers.length > 0 
          ? Math.max(...customers.map(c => c.customerId || 0), 0)
          : 0
        setFormData({ 
          customerId: maxCustomerId + 2, 
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
          id: undefined // Clear ID for new entry
        })
        // Trigger camera reset
        setResetTrigger(prev => prev + 1)
        // Refresh customers list
        await fetchCustomers()
        console.log('Customer saved. Total customers:', customers.length + 1)
      } else {
        const errorData = await response.json()
        console.error('Save error response:', errorData)
        alert(errorData.error || 'Error saving customer')
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Error saving customer')
    } finally {
      setSavingCustomer(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    // First save the customer if not already saved
    let customerId = formData.id
    
    if (!customerId) {
      // Validate required fields before saving
      if (!formData.name || !formData.name.trim()) {
        throw new Error('Please enter Customer Name before uploading photo')
      }
      
      if (!formData.address || !formData.address.trim()) {
        throw new Error('Please enter Address before uploading photo')
      }
      
      // Save customer first to get ID
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save customer. Please check required fields.')
      }
      
      const savedData = await response.json()
      // Try multiple possible response formats
      customerId = savedData.customer?.id || savedData.id || savedData.customerId
      
      if (!customerId) {
        console.error('Customer save response:', savedData)
        throw new Error('Customer saved but ID not returned. Please try again.')
      }
      
      setFormData(prev => ({ ...prev, id: customerId }))
      
      // Wait a moment for database to be ready
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Upload image
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    try {
      const response = await fetch(`/api/customers/${customerId}/images`, {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Failed to upload image'
        console.error('Image upload error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.url) {
        throw new Error('Image uploaded but URL not returned')
      }
      
      setFormData(prev => ({ ...prev, imageUrl: data.url }))
      return data.url
    } catch (error: any) {
      console.error('Image upload error:', error)
      throw error
    }
  }

  const handleImageDelete = async (): Promise<void> => {
    if (!formData.id) return

    const response = await fetch(`/api/customers/${formData.id}/images`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete image')
    }

    setFormData(prev => ({ ...prev, imageUrl: undefined }))
  }

  const handleReset = () => {
    const maxCustomerId = customers.length > 0 
      ? Math.max(...customers.map(c => c.customerId || 0), 0)
      : 0
    setFormData({ 
      customerId: maxCustomerId + 1, 
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
    })
    // Trigger camera reset
    setResetTrigger(prev => prev + 1)
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
            <h1 className="text-2xl font-bold">New Customer Entry Form</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-red-600 border-b pb-2">Customer Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer ID: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.customerId || ''}
                  onChange={(e) => handleInputChange('customerId', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Father:</label>
                <input
                  type="text"
                  value={formData.father || ''}
                  onChange={(e) => handleInputChange('father', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter father's name"
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
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Village:</label>
                <input
                  type="text"
                  value={formData.village || ''}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter village name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mandal:</label>
                <input
                  type="text"
                  value={formData.mandal || ''}
                  onChange={(e) => handleInputChange('mandal', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter mandal name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">District:</label>
                <input
                  type="text"
                  value={formData.district || ''}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter district name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone-1:</label>
                  <input
                    type="tel"
                    value={formData.phone1 || ''}
                    onChange={(e) => handleInputChange('phone1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone-2:</label>
                  <input
                    type="tel"
                    value={formData.phone2 || ''}
                    onChange={(e) => handleInputChange('phone2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter alternate phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Customer Photo:</label>
                <CustomerImageUpload
                  imageUrl={formData.imageUrl}
                  onUpload={handleImageUpload}
                  onDelete={formData.id ? handleImageDelete : undefined}
                  label="Customer Photo"
                  customerId={formData.id}
                  className="w-full"
                  resetTrigger={resetTrigger}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={savingCustomer}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {savingCustomer ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleReset}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => router.back()}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

