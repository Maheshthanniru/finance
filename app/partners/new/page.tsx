'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import { Partner } from '@/types'

interface PartnerExtended extends Partner {
  partnerId?: number
  isMD?: boolean
  mdName?: string
  village?: string
  homePhone?: string
}

export default function NewPartnerPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<PartnerExtended>>({
    partnerId: 1,
    isMD: false,
    name: '',
    phone: '',
    address: '',
    mdName: '',
    village: '',
    homePhone: '',
  })
  const [partners, setPartners] = useState<PartnerExtended[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPartners()
  }, [])

  useEffect(() => {
    // Set initial partnerId based on existing partners
    if (partners.length > 0 && (!formData.partnerId || formData.partnerId === 1)) {
      const maxPartnerId = Math.max(...partners.map(p => p.partnerId || 0), 0)
      if (maxPartnerId > 0) {
        setFormData(prev => ({ ...prev, partnerId: maxPartnerId + 1 }))
      }
    }
  }, [partners])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      setPartners(data)
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.name.trim()) {
        alert('Please enter Partner Name')
        return
      }
      
      if (!formData.partnerId || formData.partnerId <= 0) {
        alert('Please enter a valid Partner ID')
        return
      }
      
      setLoading(true)
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        alert('Partner saved successfully!')
        // Reset form for new entry
        const maxPartnerId = partners.length > 0 
          ? Math.max(...partners.map(p => p.partnerId || 0), 0)
          : 0
        setFormData({ 
          partnerId: maxPartnerId + 2, 
          isMD: false,
          name: '',
          phone: '',
          address: '',
          mdName: '',
          village: '',
          homePhone: ''
        })
        fetchPartners()
      } else {
        const error = await response.json()
        alert(error.error || 'Error saving partner')
      }
    } catch (error) {
      console.error('Error saving partner:', error)
      alert('Error saving partner')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    const maxPartnerId = partners.length > 0 
      ? Math.max(...partners.map(p => p.partnerId || 0), 0)
      : 0
    setFormData({ 
      partnerId: maxPartnerId + 1, 
      isMD: false,
      name: '',
      phone: '',
      address: '',
      mdName: '',
      village: '',
      homePhone: ''
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
            <h1 className="text-2xl font-bold">New Partner Entry Form</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6 text-red-600 border-b pb-2">Partner Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  PartnerID: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.partnerId || ''}
                  onChange={(e) => handleInputChange('partnerId', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  PartnerName: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                  placeholder="Enter partner name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone:</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address:</label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter address"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <input
                  type="checkbox"
                  checked={formData.isMD || false}
                  onChange={(e) => handleInputChange('isMD', e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label className="text-sm font-medium">is MD?</label>
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
                <label className="block text-sm font-medium mb-1">Home Phone: <span className="text-gray-500 text-xs">(Optional)</span></label>
                <input
                  type="tel"
                  value={formData.homePhone || ''}
                  onChange={(e) => handleInputChange('homePhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter home phone number (optional)"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save'}
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

