'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Loan, LoanType } from '@/types'
import GeneralCalculationModal from '@/components/GeneralCalculationModal'

export default function LoansEntryForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Loan>>({
    date: new Date().toISOString().split('T')[0],
    loanType: 'CD',
    number: 1,
    documentCharges: 0,
    period: 30,
  })
  const [password, setPassword] = useState('')
  const [existingLoans, setExistingLoans] = useState<Loan[]>([])
  const [dayBookDetails, setDayBookDetails] = useState<any[]>([])
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [partners, setPartners] = useState<any[]>([])
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('')
  const [guarantors, setGuarantors] = useState<any[]>([])
  const [selectedGuarantor1Id, setSelectedGuarantor1Id] = useState<string>('')
  const [selectedGuarantor2Id, setSelectedGuarantor2Id] = useState<string>('')

  useEffect(() => {
    fetchLoans()
    fetchCustomers()
    fetchPartners()
    fetchGuarantors()
    // Set current time on client side only to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString())
  }, [])

  useEffect(() => {
    // Fetch day book details when date changes
    fetchDayBookDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date])

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans')
      const data = await response.json()
      setExistingLoans(data.slice(0, 10)) // Show last 10 loans
    } catch (error) {
      console.error('Error fetching loans:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      setPartners(data)
    } catch (error) {
      console.error('Error fetching partners:', error)
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

  const fetchDayBookDetails = async () => {
    try {
      const date = formData.date || new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/reports/daybook?date=${date}`)
      const data = await response.json()
      
      // Map DayBookEntry format to the format expected by the display
      const formattedData = (data || []).map((entry: any) => ({
        date: date,
        account: entry.headOfAccount || entry.account_name || '',
        particulars: entry.particulars || '',
        no: entry.number || entry.rno || '',
        credit: entry.credit || 0,
        debit: entry.debit || 0,
      }))
      
      setDayBookDetails(formattedData)
    } catch (error) {
      console.error('Error fetching day book details:', error)
      setDayBookDetails([])
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      // Auto-fill form with customer data
      setFormData(prev => ({
        ...prev,
        customerName: customer.name || '',
        aadhaar: customer.aadhaar || '',
        fatherName: customer.father || '',
        address: customer.address || '',
        phone1: customer.phone1 || '',
        phone2: customer.phone2 || '',
        cNo: customer.customerId?.toString() || '',
      }))
    }
  }

  const handlePartnerSelect = (partnerId: string) => {
    setSelectedPartnerId(partnerId)
    const partner = partners.find(p => p.id === partnerId)
    if (partner) {
      // Auto-fill form with partner data
      setFormData(prev => ({
        ...prev,
        partnerId: partner.id || '',
        partnerName: partner.name || '',
      }))
    }
  }

  const handleGuarantorSelect = (guarantorNum: 1 | 2, guarantorId: string) => {
    if (guarantorNum === 1) {
      setSelectedGuarantor1Id(guarantorId)
    } else {
      setSelectedGuarantor2Id(guarantorId)
    }
    
    const guarantor = guarantors.find(g => g.id === guarantorId)
    if (guarantor) {
      // Auto-fill form with guarantor data
      setFormData(prev => ({
        ...prev,
        [`guarantor${guarantorNum}`]: {
          name: guarantor.name || '',
          aadhaar: guarantor.aadhaar || '',
          phone: guarantor.phone1 || '',
        },
      }))
    }
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
    if (!formData.customerName || !formData.loanAmount) {
      alert('Please fill in required fields: Customer Name and Loan Amount')
      return
    }

    const loan: Loan = {
      id: `loan-${Date.now()}`,
      number: formData.number || existingLoans.length + 1,
      date: formData.date || new Date().toISOString().split('T')[0],
      loanType: formData.loanType || 'CD',
      customerName: formData.customerName || '',
      fatherName: formData.fatherName,
      aadhaar: formData.aadhaar,
      cNo: formData.cNo,
      address: formData.address || '',
      phone1: formData.phone1,
      phone2: formData.phone2,
      guarantor1: formData.guarantor1,
      guarantor2: formData.guarantor2,
      particulars: formData.particulars,
      loanAmount: formData.loanAmount || 0,
      rateOfInterest: formData.rateOfInterest,
      period: formData.period || 30,
      documentCharges: formData.documentCharges || 0,
      partnerId: formData.partnerId,
      partnerName: formData.partnerName,
      userName: 'RAMESH', // This would come from auth in production
      entryTime: new Date().toISOString(),
    }

    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loan),
      })

      if (response.ok) {
        alert('Loan saved successfully!')
        router.push('/')
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || 'Error saving loan'
        console.error('Save error response:', errorData)
        alert(`Error: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error saving loan:', error)
      alert('Error saving loan. Please check your connection and try again.')
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
              <h1 className="text-2xl font-bold">Loans Entry Form</h1>
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
          {/* Left Panel - Entry Form */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Loans Entry Form</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
                <select
                  value={formData.loanType}
                  onChange={(e) => handleInputChange('loanType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Customer (Auto-fill)</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Select Customer to Auto-fill --</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerId} - {customer.name} {customer.father ? `(${customer.father})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar</label>
                <input
                  type="text"
                  value={formData.aadhaar || ''}
                  onChange={(e) => handleInputChange('aadhaar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">C.No & Name *</label>
                <input
                  type="text"
                  value={formData.customerName || ''}
                  onChange={(e) => {
                    handleInputChange('customerName', e.target.value)
                    setSelectedCustomerId('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father</label>
                <input
                  type="text"
                  value={formData.fatherName || ''}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone 1</label>
                <input
                  type="tel"
                  value={formData.phone1 || ''}
                  onChange={(e) => handleInputChange('phone1', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone 2</label>
                <input
                  type="tel"
                  value={formData.phone2 || ''}
                  onChange={(e) => handleInputChange('phone2', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Guarantor 1 (Auto-fill)</label>
                <select
                  value={selectedGuarantor1Id}
                  onChange={(e) => handleGuarantorSelect(1, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Select Guarantor 1 to Auto-fill --</option>
                  {guarantors.map((guarantor) => (
                    <option key={guarantor.id} value={guarantor.id}>
                      {guarantor.guarantorId ? `${guarantor.guarantorId} - ` : ''}{guarantor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 1</label>
                <input
                  type="text"
                  value={formData.guarantor1?.name || ''}
                  onChange={(e) => {
                    handleGuarantorChange(1, 'name', e.target.value)
                    setSelectedGuarantor1Id('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 1 Aadhaar</label>
                <input
                  type="text"
                  value={formData.guarantor1?.aadhaar || ''}
                  onChange={(e) => {
                    handleGuarantorChange(1, 'aadhaar', e.target.value)
                    setSelectedGuarantor1Id('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 1 Phone</label>
                <input
                  type="tel"
                  value={formData.guarantor1?.phone || ''}
                  onChange={(e) => {
                    handleGuarantorChange(1, 'phone', e.target.value)
                    setSelectedGuarantor1Id('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Guarantor 2 (Auto-fill)</label>
                <select
                  value={selectedGuarantor2Id}
                  onChange={(e) => handleGuarantorSelect(2, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Select Guarantor 2 to Auto-fill --</option>
                  {guarantors.map((guarantor) => (
                    <option key={guarantor.id} value={guarantor.id}>
                      {guarantor.guarantorId ? `${guarantor.guarantorId} - ` : ''}{guarantor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 2</label>
                <input
                  type="text"
                  value={formData.guarantor2?.name || ''}
                  onChange={(e) => {
                    handleGuarantorChange(2, 'name', e.target.value)
                    setSelectedGuarantor2Id('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 2 Aadhaar</label>
                <input
                  type="text"
                  value={formData.guarantor2?.aadhaar || ''}
                  onChange={(e) => {
                    handleGuarantorChange(2, 'aadhaar', e.target.value)
                    setSelectedGuarantor2Id('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor 2 Phone</label>
                <input
                  type="tel"
                  value={formData.guarantor2?.phone || ''}
                  onChange={(e) => {
                    handleGuarantorChange(2, 'phone', e.target.value)
                    setSelectedGuarantor2Id('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Particulars</label>
                <textarea
                  value={formData.particulars || ''}
                  onChange={(e) => handleInputChange('particulars', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Rs. *</label>
                <input
                  type="number"
                  value={formData.loanAmount || ''}
                  onChange={(e) => handleInputChange('loanAmount', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period (days)</label>
                <input
                  type="number"
                  value={formData.period || ''}
                  onChange={(e) => handleInputChange('period', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Charges</label>
                <input
                  type="number"
                  value={formData.documentCharges || ''}
                  onChange={(e) => handleInputChange('documentCharges', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Partner (Auto-fill)</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => handlePartnerSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">-- Select Partner to Auto-fill --</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.partnerId ? `${partner.partnerId} - ` : ''}{partner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner ID</label>
                <input
                  type="text"
                  value={formData.partnerId || ''}
                  onChange={(e) => {
                    handleInputChange('partnerId', e.target.value)
                    setSelectedPartnerId('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name</label>
                <input
                  type="text"
                  value={formData.partnerName || ''}
                  onChange={(e) => {
                    handleInputChange('partnerName', e.target.value)
                    setSelectedPartnerId('') // Clear selection if manually edited
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save
              </button>
              <button
                onClick={() => setIsGeneralModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-md"
              >
                General
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
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

          {/* Right Panel - Day Book Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Day Book Details</h3>
              <div className="text-sm text-gray-600 mb-2">Balance Without</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-left">Account</th>
                      <th className="px-2 py-1 text-left">Particulars</th>
                      <th className="px-2 py-1 text-left">No</th>
                      <th className="px-2 py-1 text-right">Credit</th>
                      <th className="px-2 py-1 text-right">Debit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayBookDetails.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400">
                          No transactions yet
                        </td>
                      </tr>
                    ) : (
                      dayBookDetails.map((detail, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{new Date(detail.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                          <td className="px-2 py-1">{detail.account}</td>
                          <td className="px-2 py-1">{detail.particulars}</td>
                          <td className="px-2 py-1">{detail.no || '-'}</td>
                          <td className="px-2 py-1 text-right">{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(detail.credit)}</td>
                          <td className="px-2 py-1 text-right">{new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(detail.debit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Existing Loans Table */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Existing Loans</h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left">No</th>
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-left">Name</th>
                      <th className="px-2 py-1 text-left">Address</th>
                      <th className="px-2 py-1 text-left">Phone</th>
                      <th className="px-2 py-1 text-left">Partner</th>
                      <th className="px-2 py-1 text-left">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {existingLoans.map((loan) => (
                      <tr key={loan.id} className="border-t hover:bg-gray-50">
                        <td className="px-2 py-1">{loan.number}</td>
                        <td className="px-2 py-1">{formatDate(loan.date)}</td>
                        <td className="px-2 py-1">{loan.customerName}</td>
                        <td className="px-2 py-1 truncate max-w-xs">{loan.address}</td>
                        <td className="px-2 py-1">{loan.phone1}</td>
                        <td className="px-2 py-1">{loan.partnerName}</td>
                        <td className="px-2 py-1">{loan.period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



