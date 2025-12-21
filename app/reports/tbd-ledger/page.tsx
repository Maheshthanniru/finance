'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X } from 'lucide-react'
import { TBDLoan, LedgerTransaction } from '@/types'
import { format } from 'date-fns'
import ImageUpload from '@/components/ImageUpload'

export default function TBDLedgerPage() {
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [formData, setFormData] = useState<Partial<TBDLoan>>({
    date: new Date().toISOString().split('T')[0],
    loanType: 'TBD',
    loanAmount: 0,
    premium: 0,
    premiumDays: 0,
    paidAmount: 0,
    paidDays: 0,
    dueAmount: 0,
    totalDays: 0,
    dueDays: 0,
  })
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>([])
  const [accounts, setAccounts] = useState<TBDLoan[]>([])
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    fetchAccounts()
    // Set current time on client side only to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString())
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountDetails(selectedAccount)
      fetchLedgerTransactions(selectedAccount)
    }
  }, [selectedAccount])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/loans?type=TBD')
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchAccountDetails = async (accountId: string) => {
    try {
      const response = await fetch(`/api/loans/${accountId}`)
      const data = await response.json()
      setFormData(data)
    } catch (error) {
      console.error('Error fetching account details:', error)
    }
  }

  const fetchLedgerTransactions = async (accountId: string) => {
    try {
      const response = await fetch(`/api/ledger/${accountId}`)
      const data = await response.json()
      setLedgerTransactions(data)
    } catch (error) {
      console.error('Error fetching ledger:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const method = formData.id && selectedAccount ? 'PUT' : 'POST'
      const url = formData.id && selectedAccount 
        ? `/api/loans/${selectedAccount}` 
        : '/api/loans'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        alert('Account saved successfully!')
        fetchAccounts()
        if (!selectedAccount && formData.id) {
          setSelectedAccount(formData.id)
        }
      } else {
        const error = await response.json()
        alert(`Error saving account: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error saving account:', error)
      alert('Error saving account')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return format(date, 'dd-MMM-yy')
  }

  const creditTotal = ledgerTransactions.reduce((sum, t) => sum + t.credit, 0)
  const debitTotal = ledgerTransactions.reduce((sum, t) => sum + t.debit, 0)
  const balance = creditTotal - debitTotal
  const totalAmount = accounts.reduce((sum, acc) => sum + (acc.loanAmount || 0), 0)

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="hover:bg-orange-600 p-2 rounded">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">TIRUMALA FINANCE</h1>
                <h2 className="text-xl font-bold">TBD LEDGER</h2>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm">User Name: RAMESH</div>
              <div className="text-sm">{currentTime || 'Loading...'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium">Today's Date:</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <div className="ml-auto">
            <span className="text-sm font-medium">0 Total Amount: </span>
            <input
              type="text"
              value={formatCurrency(totalAmount)}
              readOnly
              className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 w-32"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Account Entry Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Selection */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium mb-2">Account Number</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.number} - {acc.customerName}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name:</label>
                  <input
                    type="text"
                    value={formData.customerName || ''}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address:</label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone No:</label>
                  <input
                    type="tel"
                    value={formData.phone1 || ''}
                    onChange={(e) => handleInputChange('phone1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Guarantor:</label>
                  <input
                    type="text"
                    value={formData.guarantor1?.name || ''}
                    onChange={(e) => handleInputChange('guarantor1', { ...formData.guarantor1, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Guarantor Phone:</label>
                  <input
                    type="tel"
                    value={formData.guarantor1?.phone || ''}
                    onChange={(e) => handleInputChange('guarantor1', { ...formData.guarantor1, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Partner:</label>
                  <input
                    type="text"
                    value={formData.partnerName || ''}
                    onChange={(e) => handleInputChange('partnerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Premium Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Premium Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount:</label>
                  <input
                    type="number"
                    value={formData.loanAmount || 0}
                    onChange={(e) => handleInputChange('loanAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Premium</label>
                  <input
                    type="number"
                    value={formData.premium || 0}
                    onChange={(e) => handleInputChange('premium', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Days</label>
                  <input
                    type="number"
                    value={formData.premiumDays || 0}
                    onChange={(e) => handleInputChange('premiumDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Paid Amount</label>
                  <input
                    type="number"
                    value={formData.paidAmount || 0}
                    onChange={(e) => handleInputChange('paidAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Paid Days</label>
                  <input
                    type="number"
                    value={formData.paidDays || 0}
                    onChange={(e) => handleInputChange('paidDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Amount</label>
                  <input
                    type="number"
                    value={formData.dueAmount || 0}
                    onChange={(e) => handleInputChange('dueAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Days</label>
                  <input
                    type="number"
                    value={formData.totalDays || 0}
                    onChange={(e) => handleInputChange('totalDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">DueDays</label>
                  <input
                    type="number"
                    value={formData.dueDays || 0}
                    onChange={(e) => handleInputChange('dueDays', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Joined Date:</label>
                  <input
                    type="date"
                    value={formData.joinedDate || ''}
                    onChange={(e) => handleInputChange('joinedDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date:</label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  SAVE
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md flex items-center gap-2">
                  <X className="w-5 h-5" />
                  Close Account
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Transaction Ledger and Image Uploads */}
          <div className="space-y-6">
            {/* Image Upload Components */}
            {selectedAccount && (
              <div className="grid grid-cols-1 gap-4">
                <ImageUpload
                  imageUrl={formData.customerImageUrl}
                  label="Loan Person"
                  loanId={selectedAccount}
                  imageType="customer"
                  onUpload={async (file) => {
                    const uploadFormData = new FormData()
                    uploadFormData.append('file', file)
                    uploadFormData.append('imageType', 'customer')
                    
                    const response = await fetch(`/api/loans/${selectedAccount}/images`, {
                      method: 'POST',
                      body: uploadFormData,
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Upload failed')
                    }
                    
                    const data = await response.json()
                    setFormData(prev => ({ ...prev, customerImageUrl: data.url }))
                    return data.url
                  }}
                  onDelete={async () => {
                    const response = await fetch(`/api/loans/${selectedAccount}/images?imageType=customer`, {
                      method: 'DELETE',
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Delete failed')
                    }
                    
                    setFormData(prev => ({ ...prev, customerImageUrl: undefined }))
                  }}
                />
                <ImageUpload
                  imageUrl={formData.guarantor1ImageUrl}
                  label="Surety Person"
                  loanId={selectedAccount}
                  imageType="guarantor1"
                  onUpload={async (file) => {
                    const uploadFormData = new FormData()
                    uploadFormData.append('file', file)
                    uploadFormData.append('imageType', 'guarantor1')
                    
                    const response = await fetch(`/api/loans/${selectedAccount}/images`, {
                      method: 'POST',
                      body: uploadFormData,
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Upload failed')
                    }
                    
                    const data = await response.json()
                    setFormData(prev => ({ ...prev, guarantor1ImageUrl: data.url }))
                    return data.url
                  }}
                  onDelete={async () => {
                    const response = await fetch(`/api/loans/${selectedAccount}/images?imageType=guarantor1`, {
                      method: 'DELETE',
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Delete failed')
                    }
                    
                    setFormData(prev => ({ ...prev, guarantor1ImageUrl: undefined }))
                  }}
                />
                <ImageUpload
                  imageUrl={formData.partnerImageUrl}
                  label="Partner"
                  loanId={selectedAccount}
                  imageType="partner"
                  onUpload={async (file) => {
                    const uploadFormData = new FormData()
                    uploadFormData.append('file', file)
                    uploadFormData.append('imageType', 'partner')
                    
                    const response = await fetch(`/api/loans/${selectedAccount}/images`, {
                      method: 'POST',
                      body: uploadFormData,
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Upload failed')
                    }
                    
                    const data = await response.json()
                    setFormData(prev => ({ ...prev, partnerImageUrl: data.url }))
                    return data.url
                  }}
                  onDelete={async () => {
                    const response = await fetch(`/api/loans/${selectedAccount}/images?imageType=partner`, {
                      method: 'DELETE',
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Delete failed')
                    }
                    
                    setFormData(prev => ({ ...prev, partnerImageUrl: undefined }))
                  }}
                />
              </div>
            )}

            {/* Transaction Ledger Table */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-4">Transaction Ledger</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">Date</th>
                      <th className="px-2 py-2 text-right border">Credit</th>
                      <th className="px-2 py-2 text-right border">Debit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-2 py-4 text-center text-gray-400 border">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      ledgerTransactions.map((transaction, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{formatDate(transaction.date)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(transaction.credit)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(transaction.debit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-2 py-2 border">Total:</td>
                      <td className="px-2 py-2 border text-right">{formatCurrency(creditTotal)}</td>
                      <td className="px-2 py-2 border text-right">{formatCurrency(debitTotal)}</td>
                    </tr>
                    <tr className="bg-orange-50 font-bold">
                      <td className="px-2 py-2 border">Balance:</td>
                      <td colSpan={2} className="px-2 py-2 border text-right">{formatCurrency(balance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


