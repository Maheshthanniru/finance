'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Search, Trash2 } from 'lucide-react'
import { Loan, LoanType } from '@/types'
import GeneralCalculationModal from '@/components/GeneralCalculationModal'

export default function EditLoansPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Loan[]>([])
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [formData, setFormData] = useState<Partial<Loan>>({})
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    // Set current time on client side only to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString())
  }, [])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      alert('Please enter a search term')
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/search/loans?withName=${searchTerm}`)
      const data = await response.json()
      setSearchResults(data.loans || data.allLoans || [])
    } catch (error) {
      console.error('Error searching loans:', error)
      alert('Error searching loans')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLoan = (loan: Loan) => {
    setSelectedLoan(loan)
    setFormData(loan)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGuarantorChange = (guarantorNum: 1 | 2, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [`guarantor${guarantorNum}`]: {
        ...(prev[`guarantor${guarantorNum}` as keyof Loan] as any || {}),
        [field]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!formData.id) {
      alert('Please select a loan to edit')
      return
    }

    try {
      const response = await fetch(`/api/loans/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Loan updated successfully!')
        handleSearch() // Refresh search results
      } else {
        const error = await response.json()
        alert(`Error updating loan: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating loan:', error)
      alert('Error updating loan')
    }
  }

  const handleDelete = async () => {
    if (!formData.id) {
      alert('Please select a loan to delete')
      return
    }

    if (!confirm('Are you sure you want to delete this loan?')) return

    try {
      const response = await fetch(`/api/loans?id=${formData.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Loan deleted successfully!')
        setSelectedLoan(null)
        setFormData({})
        handleSearch() // Refresh search results
      } else {
        alert('Error deleting loan')
      }
    } catch (error) {
      console.error('Error deleting loan:', error)
      alert('Error deleting loan')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-orange-600 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Edit Loans</h1>
            </div>
            <div className="text-right">
              <div className="text-sm">User Name: RAMESH</div>
              <div className="text-sm">{currentTime || 'Loading...'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Search and Results */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Search Loans</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Search by Name or Number:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter name or loan number"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <Search className="w-4 h-4" />
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-3">Search Results</h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">No</th>
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-gray-400">
                          No loans found. Use search to find loans.
                        </td>
                      </tr>
                    ) : (
                      searchResults.map((loan) => (
                        <tr
                          key={loan.id}
                          className={`border-t hover:bg-gray-50 cursor-pointer ${
                            selectedLoan?.id === loan.id ? 'bg-orange-50' : ''
                          }`}
                          onClick={() => handleSelectLoan(loan)}
                        >
                          <td className="px-2 py-1">{loan.number}</td>
                          <td className="px-2 py-1">{formatDate(loan.date)}</td>
                          <td className="px-2 py-1 truncate max-w-xs">{loan.customerName}</td>
                          <td className="px-2 py-1">{loan.loanType}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel - Edit Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Loan Form</h2>
            
            {!selectedLoan ? (
              <div className="text-center py-12 text-gray-400">
                <p>Select a loan from search results to edit</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                    <select
                      value={formData.loanType}
                      onChange={(e) => handleInputChange('loanType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="CD">CD</option>
                      <option value="HP">HP</option>
                      <option value="STBD">STBD</option>
                      <option value="TBD">TBD</option>
                      <option value="FD">FD</option>
                      <option value="OD">OD</option>
                      <option value="RD">RD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number</label>
                    <input
                      type="number"
                      value={formData.number || ''}
                      onChange={(e) => handleInputChange('number', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar</label>
                    <input
                      type="text"
                      value={formData.aadhaar || ''}
                      onChange={(e) => handleInputChange('aadhaar', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">C.No & Name *</label>
                    <input
                      type="text"
                      value={formData.customerName || ''}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Father</label>
                    <input
                      type="text"
                      value={formData.fatherName || ''}
                      onChange={(e) => handleInputChange('fatherName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone 1</label>
                    <input
                      type="tel"
                      value={formData.phone1 || ''}
                      onChange={(e) => handleInputChange('phone1', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone 2</label>
                    <input
                      type="tel"
                      value={formData.phone2 || ''}
                      onChange={(e) => handleInputChange('phone2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 1</label>
                    <input
                      type="text"
                      value={formData.guarantor1?.name || ''}
                      onChange={(e) => handleGuarantorChange(1, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 1 Aadhaar</label>
                    <input
                      type="text"
                      value={formData.guarantor1?.aadhaar || ''}
                      onChange={(e) => handleGuarantorChange(1, 'aadhaar', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 1 Phone</label>
                    <input
                      type="tel"
                      value={formData.guarantor1?.phone || ''}
                      onChange={(e) => handleGuarantorChange(1, 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 2</label>
                    <input
                      type="text"
                      value={formData.guarantor2?.name || ''}
                      onChange={(e) => handleGuarantorChange(2, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 2 Aadhaar</label>
                    <input
                      type="text"
                      value={formData.guarantor2?.aadhaar || ''}
                      onChange={(e) => handleGuarantorChange(2, 'aadhaar', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 2 Phone</label>
                    <input
                      type="tel"
                      value={formData.guarantor2?.phone || ''}
                      onChange={(e) => handleGuarantorChange(2, 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Particulars</label>
                    <textarea
                      value={formData.particulars || ''}
                      onChange={(e) => handleInputChange('particulars', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loan Rs. *</label>
                    <input
                      type="number"
                      value={formData.loanAmount || ''}
                      onChange={(e) => handleInputChange('loanAmount', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate of Interest</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.rateOfInterest || ''}
                      onChange={(e) => handleInputChange('rateOfInterest', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Period (days)</label>
                    <input
                      type="number"
                      value={formData.period || ''}
                      onChange={(e) => handleInputChange('period', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Charges</label>
                    <input
                      type="number"
                      value={formData.documentCharges || ''}
                      onChange={(e) => handleInputChange('documentCharges', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                    <input
                      type="text"
                      value={formData.partnerId || ''}
                      onChange={(e) => handleInputChange('partnerId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
                    <input
                      type="text"
                      value={formData.partnerName || ''}
                      onChange={(e) => handleInputChange('partnerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Update
                  </button>
                  <button
                    onClick={() => setIsGeneralModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md"
                  >
                    General
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <GeneralCalculationModal
        isOpen={isGeneralModalOpen}
        onClose={() => setIsGeneralModalOpen(false)}
        loanType={formData.loanType}
        loanAmount={formData.loanAmount}
        loanPeriod={formData.period}
      />
    </div>
  )
}


