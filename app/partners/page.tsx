'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCw, X, Printer, Search } from 'lucide-react'
import { Partner } from '@/types'

interface PartnerExtended extends Partner {
  partnerId?: number
  isMD?: boolean
  mdName?: string
  village?: string
  homePhone?: string
}

export default function PartnersPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<PartnerExtended>>({
    partnerId: 1,
    isMD: false,
  })
  const [partners, setPartners] = useState<PartnerExtended[]>([])
  const [mdWisePartners, setMdWisePartners] = useState<PartnerExtended[]>([])
  const [selectedPartner, setSelectedPartner] = useState<string>('')
  const [partnerLoans, setPartnerLoans] = useState<any[]>([])

  useEffect(() => {
    fetchPartners()
  }, [])

  useEffect(() => {
    if (selectedPartner) {
      const partner = partners.find(p => p.id === selectedPartner)
      if (partner) {
        setFormData(partner)
        fetchPartnerLoans(partner.id)
      }
    }
  }, [selectedPartner, partners])

  useEffect(() => {
    const mdPartners = partners.filter(p => p.isMD)
    setMdWisePartners(mdPartners.length > 0 ? mdPartners : partners)
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

  const fetchPartnerLoans = async (partnerId: string) => {
    try {
      const response = await fetch(`/api/partners/${partnerId}/loans`)
      const data = await response.json()
      setPartnerLoans(data)
    } catch (error) {
      console.error('Error fetching partner loans:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const response = await fetch('/api/partners', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        alert('Partner saved successfully!')
        fetchPartners()
        setFormData({ partnerId: partners.length + 1, isMD: false })
      }
    } catch (error) {
      console.error('Error saving partner:', error)
      alert('Error saving partner')
    }
  }

  const handleUpdate = async () => {
    if (!formData.id) {
      alert('Please select a partner to update')
      return
    }
    await handleSave()
  }

  const handleDelete = async () => {
    if (!formData.id) {
      alert('Please select a partner to delete')
      return
    }
    if (!confirm('Are you sure you want to delete this partner?')) return

    try {
      const response = await fetch(`/api/partners?id=${formData.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        alert('Partner deleted successfully!')
        fetchPartners()
        setFormData({ partnerId: partners.length, isMD: false })
      }
    } catch (error) {
      console.error('Error deleting partner:', error)
      alert('Error deleting partner')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Partners</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - New Partners Entry Form */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-red-600">New Partners Entry Form</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PartnerID:</label>
                  <input
                    type="number"
                    value={formData.partnerId || ''}
                    onChange={(e) => handleInputChange('partnerId', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PartnerName:</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isMD || false}
                    onChange={(e) => handleInputChange('isMD', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">is MD?</label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">MDName:</label>
                  <select
                    value={formData.mdName || ''}
                    onChange={(e) => handleInputChange('mdName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select MD</option>
                    {partners.filter(p => p.isMD).map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Village:</label>
                  <input
                    type="text"
                    value={formData.village || ''}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Home Phone:</label>
                  <input
                    type="tel"
                    value={formData.homePhone || ''}
                    onChange={(e) => handleInputChange('homePhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Update
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ partnerId: partners.length + 1, isMD: false })
                      setSelectedPartner('')
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    Close
                  </button>
                </div>
                <div className="flex gap-3 pt-2">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Print ID wise
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Print Name wise
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Print MD wise
                  </button>
                </div>
              </div>
            </div>

            {/* Partners Loans Subform */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Partners Loans subform</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">Loan</th>
                      <th className="px-2 py-2 text-left border">No.</th>
                      <th className="px-2 py-2 text-left border">Name</th>
                      <th className="px-2 py-2 text-left border">Partner</th>
                      <th className="px-2 py-2 text-right border">Balance</th>
                      <th className="px-2 py-2 text-left border">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerLoans.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400 border">
                          No loans found
                        </td>
                      </tr>
                    ) : (
                      partnerLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{loan.loanType}</td>
                          <td className="px-2 py-2 border">{loan.number}</td>
                          <td className="px-2 py-2 border">{loan.customerName}</td>
                          <td className="px-2 py-2 border">{loan.partnerName}</td>
                          <td className="px-2 py-2 border text-right">{loan.loanAmount}</td>
                          <td className="px-2 py-2 border">{loan.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">Record:</span>
                <input
                  type="text"
                  value={partnerLoans.length}
                  readOnly
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md bg-gray-50"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - All Partners and MD Wise Partners */}
          <div className="space-y-6">
            {/* All Partners Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">All Partners</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">PartnerName</th>
                      <th className="px-2 py-2 text-center border">ISMD</th>
                      <th className="px-2 py-2 text-left border">MDName</th>
                      <th className="px-2 py-2 text-left border">Village</th>
                      <th className="px-2 py-2 text-left border">PartnerPhone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400 border">
                          No partners found
                        </td>
                      </tr>
                    ) : (
                      partners.map((partner) => (
                        <tr
                          key={partner.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedPartner === partner.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedPartner(partner.id)}
                        >
                          <td className="px-2 py-2 border">{partner.partnerId || '-'}</td>
                          <td className="px-2 py-2 border">{partner.name}</td>
                          <td className="px-2 py-2 border text-center">
                            <input
                              type="checkbox"
                              checked={partner.isMD || false}
                              readOnly
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-2 py-2 border">{partner.mdName || '-'}</td>
                          <td className="px-2 py-2 border">{partner.village || '-'}</td>
                          <td className="px-2 py-2 border">{partner.homePhone || partner.phone || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Record: 1 of {partners.length}</span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            {/* MD Wise Partners Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">MD Wise Partners</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">PartnerName</th>
                      <th className="px-2 py-2 text-center border">ISMD</th>
                      <th className="px-2 py-2 text-left border">MDName</th>
                      <th className="px-2 py-2 text-left border">Village</th>
                      <th className="px-2 py-2 text-left border">PartnerP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mdWisePartners.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400 border">
                          No MD partners found
                        </td>
                      </tr>
                    ) : (
                      mdWisePartners.map((partner) => (
                        <tr
                          key={partner.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 border">{partner.partnerId || '-'}</td>
                          <td className="px-2 py-2 border">{partner.name}</td>
                          <td className="px-2 py-2 border text-center">
                            <input
                              type="checkbox"
                              checked={partner.isMD || false}
                              readOnly
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-2 py-2 border">{partner.mdName || '-'}</td>
                          <td className="px-2 py-2 border">{partner.village || '-'}</td>
                          <td className="px-2 py-2 border">{partner.homePhone || partner.phone || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Record: 1 of {mdWisePartners.length}</span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
