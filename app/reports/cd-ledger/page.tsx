'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCw, FileText, X } from 'lucide-react'
import { CDLoan, LedgerTransaction } from '@/types'
import { format } from 'date-fns'
import ImageUpload from '@/components/ImageUpload'

export default function CDLedgerPage() {
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [formData, setFormData] = useState<Partial<CDLoan>>({
    date: new Date().toISOString().split('T')[0],
    loanType: 'CD',
    loanAmount: 0,
    amountPaid: 0,
    presentInterest: 0,
    totalBalance: 0,
    penalty: 0,
    totalAmtForRenewal: 0,
    totalAmtForClose: 0,
  })
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>([])
  const [accounts, setAccounts] = useState<CDLoan[]>([])
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    fetchAccounts()
    // Set current time on client side only to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString())
  }, [])

  const calculateLoanDetails = (loan: any, transactions: LedgerTransaction[], todayDate: string) => {
    const today = new Date(todayDate)
    const loanDate = loan.loanDate ? new Date(loan.loanDate) : (loan.date ? new Date(loan.date) : today)
    const dueDate = loan.dueDate ? new Date(loan.dueDate) : null
    
    // Calculate due days (days between due date and today)
    let dueDays = 0
    if (dueDate) {
      const diffTime = today.getTime() - dueDate.getTime()
      dueDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }
    
    // Calculate amount paid from ledger transactions (sum of debits)
    const amountPaid = transactions.reduce((sum, t) => sum + t.debit, 0)
    
    // Get rate of interest (use rate if available, otherwise use rateOfInterest, default to 12%)
    const rate = loan.rate || loan.rateOfInterest || 12
    
    // Get period in days (use period from loan, calculate from dates, or default to 365)
    let periodDays = loan.period || 0
    if (!periodDays && loanDate && dueDate) {
      const diffTime = dueDate.getTime() - loanDate.getTime()
      periodDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }
    if (!periodDays) periodDays = 365 // Default to 1 year
    
    // Calculate present interest: (Loan Amount * Rate * Period in years) / 100
    // Period in years = periodDays / 365
    const periodYears = periodDays / 365
    const presentInterest = (loan.loanAmount * rate * periodYears) / 100
    
    // Calculate total balance: Loan Amount + Interest - Amount Paid
    const totalBalance = loan.loanAmount + presentInterest - amountPaid
    
    // Calculate penalty: Typically 1-2% per month on overdue amount, or based on due days
    // For simplicity: 1% per 30 days overdue on total balance
    let penalty = 0
    if (dueDays > 0 && totalBalance > 0) {
      const penaltyMonths = dueDays / 30
      penalty = (totalBalance * penaltyMonths * 1) / 100 // 1% per month
    }
    
    // Calculate total amount for renewal: Principal + Interest + Penalty
    const totalAmtForRenewal = loan.loanAmount + presentInterest + penalty
    
    // Calculate total amount for close: Same as renewal
    const totalAmtForClose = totalAmtForRenewal
    
    return {
      amountPaid,
      presentInterest: Math.round(presentInterest * 100) / 100,
      totalBalance: Math.round(totalBalance * 100) / 100,
      dueDays,
      penalty: Math.round(penalty * 100) / 100,
      totalAmtForRenewal: Math.round(totalAmtForRenewal * 100) / 100,
      totalAmtForClose: Math.round(totalAmtForClose * 100) / 100,
    }
  }

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountDetails(selectedAccount)
      fetchLedgerTransactions(selectedAccount)
    }
  }, [selectedAccount])

  // Calculate loan details automatically when loan data and transactions are loaded
  useEffect(() => {
    if (selectedAccount && formData.loanAmount !== undefined && formData.loanAmount > 0 && ledgerTransactions) {
      const todayDate = formData.date || new Date().toISOString().split('T')[0]
      const calculated = calculateLoanDetails(formData, ledgerTransactions, todayDate)
      
      // Only update calculated fields, don't trigger re-render loops
      setFormData(prev => {
        // Skip update if values haven't changed (prevent infinite loop)
        const hasChanges = 
          prev.amountPaid !== calculated.amountPaid ||
          prev.presentInterest !== calculated.presentInterest ||
          prev.totalBalance !== calculated.totalBalance ||
          prev.dueDays !== calculated.dueDays ||
          prev.penalty !== calculated.penalty ||
          prev.totalAmtForRenewal !== calculated.totalAmtForRenewal ||
          prev.totalAmtForClose !== calculated.totalAmtForClose
        
        if (!hasChanges) return prev
        
        // Calculate dueDate if not set: loanDate + period days
        let calculatedDueDate = prev.dueDate
        if (!calculatedDueDate && prev.loanDate && prev.period) {
          const loanDateObj = new Date(prev.loanDate)
          loanDateObj.setDate(loanDateObj.getDate() + prev.period)
          calculatedDueDate = loanDateObj.toISOString().split('T')[0]
        } else if (!calculatedDueDate && prev.loanDate) {
          const loanDateObj = new Date(prev.loanDate)
          loanDateObj.setDate(loanDateObj.getDate() + 365) // Default to 365 days
          calculatedDueDate = loanDateObj.toISOString().split('T')[0]
        }
        
        return {
          ...prev,
          ...calculated,
          // Set loanDate and dueDate if not already set
          loanDate: prev.loanDate || prev.date,
          dueDate: calculatedDueDate,
          // Auto-populate receiptNo and rate if not set
          receiptNo: prev.receiptNo || prev.number,
          rate: prev.rate || prev.rateOfInterest,
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, formData.loanAmount, formData.rate, formData.rateOfInterest, formData.period, formData.date, JSON.stringify(ledgerTransactions)])

  // Recalculate due days when due date changes
  useEffect(() => {
    if (formData.dueDate && formData.date) {
      const today = new Date(formData.date)
      const dueDate = new Date(formData.dueDate)
      const diffTime = today.getTime() - dueDate.getTime()
      const dueDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      
      if (formData.dueDays !== dueDays) {
        setFormData(prev => {
          // Recalculate all values with new due days
          const todayDate = prev.date || new Date().toISOString().split('T')[0]
          const calculated = calculateLoanDetails(prev, ledgerTransactions, todayDate)
          
          return {
            ...prev,
            dueDays: calculated.dueDays,
            penalty: calculated.penalty,
            totalAmtForRenewal: calculated.totalAmtForRenewal,
            totalAmtForClose: calculated.totalAmtForClose,
          }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.dueDate, formData.date])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/loans?type=CD')
      if (!response.ok) {
        throw new Error(`Failed to fetch accounts: ${response.statusText}`)
      }
      const data = await response.json()
      if (data.error) {
        console.error('Error from API:', data.error)
        setAccounts([])
        return
      }
      setAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts([])
    }
  }

  const fetchAccountDetails = async (accountId: string) => {
    try {
      const response = await fetch(`/api/loans/${accountId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch account details: ${response.statusText}`)
      }
      const data = await response.json()
      if (data.error) {
        console.error('Error from API:', data.error)
        return
      }
      // Set all loan details including images - images will automatically display
      // Auto-populate receiptNo and rate from loan data if not already set
      setFormData(prev => ({
        ...data,
        receiptNo: data.receiptNo || data.number,
        rate: data.rate || data.rateOfInterest,
        loanDate: data.loanDate || data.date,
      }))
    } catch (error) {
      console.error('Error fetching account details:', error)
    }
  }

  const fetchLedgerTransactions = async (accountId: string) => {
    try {
      const response = await fetch(`/api/ledger/${accountId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch ledger: ${response.statusText}`)
      }
      const data = await response.json()
      if (data.error) {
        console.error('Error from API:', data.error)
        setLedgerTransactions([])
        return
      }
      setLedgerTransactions(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching ledger:', error)
      setLedgerTransactions([])
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
              <h1 className="text-2xl font-bold">CD LEDGER</h1>
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
          <button
            onClick={() => router.push('/reports/stbd-ledger')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"
          >
            Goto STBD Ledger
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Account Selection and Customer Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Selection */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium mb-2">A/c Number</label>
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
              <h3 className="text-lg font-bold mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.customerName || ''}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">S/o W/o</label>
                  <input
                    type="text"
                    value={formData.fatherName || ''}
                    onChange={(e) => handleInputChange('fatherName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone No 1</label>
                  <input
                    type="tel"
                    value={formData.phone1 || ''}
                    onChange={(e) => handleInputChange('phone1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone No 2</label>
                  <input
                    type="tel"
                    value={formData.phone2 || ''}
                    onChange={(e) => handleInputChange('phone2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Aadhaar</label>
                  <input
                    type="text"
                    value={formData.aadhaar || ''}
                    onChange={(e) => handleInputChange('aadhaar', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Partner</label>
                  <input
                    type="text"
                    value={formData.partnerName || ''}
                    onChange={(e) => handleInputChange('partnerName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Loan Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Loan Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Receipt No <span className="text-xs text-gray-500">(Auto-filled)</span></label>
                  <input
                    type="number"
                    value={formData.receiptNo || formData.number || ''}
                    onChange={(e) => handleInputChange('receiptNo', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Auto-filled from loan number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate <span className="text-xs text-gray-500">(Auto-filled)</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rate || formData.rateOfInterest || ''}
                    onChange={(e) => handleInputChange('rate', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Auto-filled from loan rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loan Amount</label>
                  <input
                    type="number"
                    value={formData.loanAmount || 0}
                    onChange={(e) => handleInputChange('loanAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount Paid <span className="text-xs text-gray-500">(Auto-calculated from ledger)</span></label>
                  <input
                    type="number"
                    value={formData.amountPaid || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Present Interest <span className="text-xs text-gray-500">(Auto-calculated)</span></label>
                  <input
                    type="number"
                    value={formData.presentInterest || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Balance <span className="text-xs text-gray-500">(Auto-calculated)</span></label>
                  <input
                    type="number"
                    value={formData.totalBalance || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loan Date</label>
                  <input
                    type="date"
                    value={formData.loanDate || ''}
                    onChange={(e) => handleInputChange('loanDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Days <span className="text-xs text-gray-500">(Auto-calculated)</span></label>
                  <input
                    type="number"
                    value={formData.dueDays || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Penalty <span className="text-xs text-gray-500">(Auto-calculated)</span></label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.penalty || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amt for Renewal <span className="text-xs text-gray-500">(Auto-calculated)</span></label>
                  <input
                    type="number"
                    value={formData.totalAmtForRenewal || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amt for Close <span className="text-xs text-gray-500">(Auto-calculated)</span></label>
                  <input
                    type="number"
                    value={formData.totalAmtForClose || 0}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Document Status</label>
                  <input
                    type="text"
                    value={formData.documentStatus || ''}
                    onChange={(e) => handleInputChange('documentStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Document Type</label>
                  <input
                    type="text"
                    value={formData.documentType || ''}
                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                  Renewal Account
                </button>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                  Partial Payment and Renewal
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                  Close Account
                </button>
              </div>
            </div>

            {/* Guarantor Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Guarantor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Guarantor 1</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={formData.guarantor1?.name || ''}
                      onChange={(e) => handleInputChange('guarantor1', { ...formData.guarantor1, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Aadhaar"
                      value={formData.guarantor1?.aadhaar || ''}
                      onChange={(e) => handleInputChange('guarantor1', { ...formData.guarantor1, aadhaar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="tel"
                      placeholder="Phone No"
                      value={formData.guarantor1?.phone || ''}
                      onChange={(e) => handleInputChange('guarantor1', { ...formData.guarantor1, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Guarantor 2</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={formData.guarantor2?.name || ''}
                      onChange={(e) => handleInputChange('guarantor2', { ...formData.guarantor2, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Aadhaar"
                      value={formData.guarantor2?.aadhaar || ''}
                      onChange={(e) => handleInputChange('guarantor2', { ...formData.guarantor2, aadhaar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="tel"
                      placeholder="Phone No"
                      value={formData.guarantor2?.phone || ''}
                      onChange={(e) => handleInputChange('guarantor2', { ...formData.guarantor2, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save
              </button>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
              <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Open Report
              </button>
            </div>
          </div>

          {/* Right Panel - Transaction Ledger */}
          <div className="space-y-6">
            {/* Image Upload Components - Automatically loaded when loan is selected */}
            {selectedAccount && (
              <div className="grid grid-cols-2 gap-4">
                <ImageUpload
                  key={`customer-${selectedAccount}`}
                  imageUrl={formData.customerImageUrl}
                  label="Loan Person"
                  loanId={selectedAccount}
                  imageType="customer"
                  onUpload={async (file) => {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('imageType', 'customer')
                    
                    const response = await fetch(`/api/loans/${selectedAccount}/images`, {
                      method: 'POST',
                      body: formData,
                    })
                    
                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Upload failed')
                    }
                    
                    const data = await response.json()
                    // Update local state
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
                  key={`guarantor1-${selectedAccount}`}
                  imageUrl={formData.guarantor1ImageUrl}
                  label="Surety Person"
                  loanId={selectedAccount}
                  imageType="guarantor1"
                  onUpload={async (file) => {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('imageType', 'guarantor1')
                    
                    const response = await fetch(`/api/loans/${selectedAccount}/images`, {
                      method: 'POST',
                      body: formData,
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
                      <th className="px-2 py-2 text-left border">A/c Name</th>
                      <th className="px-2 py-2 text-right border">Credit</th>
                      <th className="px-2 py-2 text-right border">Debit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-gray-400 border">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      ledgerTransactions.map((transaction, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{formatDate(transaction.date)}</td>
                          <td className="px-2 py-2 border">{transaction.particulars || '-'}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(transaction.credit)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(transaction.debit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={2} className="px-2 py-2 border">Total:</td>
                      <td className="px-2 py-2 border text-right">{formatCurrency(creditTotal)}</td>
                      <td className="px-2 py-2 border text-right">{formatCurrency(debitTotal)}</td>
                    </tr>
                    <tr className="bg-orange-50 font-bold">
                      <td colSpan={3} className="px-2 py-2 border">Balance:</td>
                      <td className="px-2 py-2 border text-right">{formatCurrency(balance)}</td>
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


