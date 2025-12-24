'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'

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

  useEffect(() => {
    fetchGuarantors()
  }, [])

  useEffect(() => {
    // Set initial guarantorId based on existing guarantors
    if (guarantors.length > 0 && (!formData.guarantorId || formData.guarantorId === 1)) {
      const maxGuarantorId = Math.max(...guarantors.map(g => g.guarantorId || 0), 0)
      if (maxGuarantorId > 0) {
        setFormData(prev => ({ ...prev, guarantorId: maxGuarantorId + 1 }))
      }
    }
  }, [guarantors])

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
      
      if (!formData.guarantorId || formData.guarantorId <= 0) {
        alert('Please enter a valid Guarantor ID')
        return
      }
      
      setSavingGuarantor(true)
      const response = await fetch('/api/guarantors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        const savedGuarantor = await response.json()
        alert('Guarantor saved successfully!')
        // Reset form for new entry
        const maxGuarantorId = guarantors.length > 0 
          ? Math.max(...guarantors.map(g => g.guarantorId || 0), 0)
          : 0
        setFormData({ 
          guarantorId: maxGuarantorId + 2, 
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
        // Refresh guarantors list
        await fetchGuarantors()
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

  const handleReset = () => {
    const maxGuarantorId = guarantors.length > 0 
      ? Math.max(...guarantors.map(g => g.guarantorId || 0), 0)
      : 0
    setFormData({ 
      guarantorId: maxGuarantorId + 1, 
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
                </label>
                <input
                  type="number"
                  value={formData.guarantorId || ''}
                  onChange={(e) => handleInputChange('guarantorId', parseInt(e.target.value) || 0)}
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

