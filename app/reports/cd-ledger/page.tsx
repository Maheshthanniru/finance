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
    // Parse dates correctly - handle YYYY-MM-DD format and avoid timezone issues
    // Use actual current date if todayDate is in the past (to ensure accurate due days calculation)
    const todayDateObj = new Date(todayDate + 'T00:00:00')
    const actualToday = new Date()
    actualToday.setHours(0, 0, 0, 0)
    
    // Use the later of the two dates (user's date or actual today) for due days calculation only
    // This ensures overdue loans show correct due days even if user date is old
    const today = todayDateObj > actualToday ? todayDateObj : actualToday
    
    // CRITICAL: For interest calculation, use ONLY the original loan date from loanDate field
    // The database has 'date' field which is the original loan date
    // When loan is fetched, we preserve it in 'loanDate' field
    // DO NOT use loan.date as fallback - it's the form's "today" date field, not the original loan date
    let loanDate: Date | null = null
    if (loan.loanDate) {
      const parsedLoanDate = new Date(loan.loanDate + 'T00:00:00')
      if (!isNaN(parsedLoanDate.getTime())) {
        loanDate = parsedLoanDate
      }
    }
    
    // If loanDate is still null, return early - cannot calculate interest without original loan date
    // This prevents incorrect calculations using wrong dates
    if (!loanDate) {
      // Return zero values if loan date is not available - better than wrong calculation
      return {
        amountPaid: transactions.reduce((sum, t) => sum + t.debit, 0),
        presentInterest: 0,
        totalBalance: loan.loanAmount || 0,
        dueDays: 0,
        penalty: 0,
        totalAmtForRenewal: loan.loanAmount || 0,
        totalAmtForClose: loan.loanAmount || 0,
      }
    }
    const dueDate = loan.dueDate ? new Date(loan.dueDate + 'T00:00:00') : null
    
    // Calculate due days (days between due date and today) - positive if overdue
    // This is ONLY for showing overdue status, NOT for interest calculation
    let dueDays = 0
    if (dueDate && !isNaN(dueDate.getTime())) {
      const diffTime = today.getTime() - dueDate.getTime()
      dueDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }
    
    // Calculate amount paid from ledger transactions (sum of debits)
    const amountPaid = transactions.reduce((sum, t) => sum + t.debit, 0)
    
    // Get rate of interest (use rate if available, otherwise use rateOfInterest, default to 12%)
    const rate = loan.rate || loan.rateOfInterest || 12
    
    // IMPORTANT: Calculate interest based ONLY on period from ORIGINAL LOAN DATE to DUE DATE
    // Interest stops accruing at the due date, not at today
    // CRITICAL: loanDate MUST be the original loan date from database, NOT today's date
    let periodDays = 0
    if (loanDate && dueDate && !isNaN(loanDate.getTime()) && !isNaN(dueDate.getTime())) {
      // Calculate period from ORIGINAL loan date to due date ONLY (NOT from today to due date)
      const diffTime = dueDate.getTime() - loanDate.getTime()
      periodDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    } else {
      // If period couldn't be calculated from dates, use stored period field or default
      periodDays = loan.period || 365 // Default to 1 year if no period available
    }
    
    // Calculate present interest based ONLY on original loan period (loan date to due date)
    // Interest does NOT accrue beyond the due date - penalty applies instead
    // Formula: (Loan Amount * Rate * Period in years) / 100
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
    // CRITICAL: Don't calculate if loanDate is not set yet (loan hasn't been fully loaded)
    if (!selectedAccount || !formData.loanDate || formData.loanAmount === undefined || formData.loanAmount <= 0 || !Array.isArray(ledgerTransactions)) {
      return
    }
    
    // Use the date field as "today" for calculation, or actual today's date
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
        // CRITICAL: Preserve loanDate - it's the original loan date from database, never changes
        loanDate: prev.loanDate, // Explicitly preserve original loan date
        // Only set dueDate if not already set
        dueDate: calculatedDueDate || prev.dueDate,
        // Auto-populate receiptNo and rate if not set
        receiptNo: prev.receiptNo || prev.number,
        rate: prev.rate || prev.rateOfInterest,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, formData.loanAmount, formData.rate, formData.rateOfInterest, formData.period, formData.date, formData.loanDate, JSON.stringify(ledgerTransactions)])

  // Recalculate due days when due date or date field changes
  useEffect(() => {
    // CRITICAL: Don't calculate if loanDate is not set yet (loan hasn't been fully loaded)
    if (!formData.loanDate || !formData.dueDate || !formData.loanAmount || !Array.isArray(ledgerTransactions)) {
      return
    }
    
    setFormData(prev => {
      // Recalculate all values with current dates
      const todayDate = prev.date || new Date().toISOString().split('T')[0]
      const calculated = calculateLoanDetails(prev, ledgerTransactions, todayDate)
      
      // Only update if values changed to prevent infinite loops
      if (
        prev.dueDays === calculated.dueDays &&
        prev.penalty === calculated.penalty &&
        prev.totalAmtForRenewal === calculated.totalAmtForRenewal &&
        prev.totalAmtForClose === calculated.totalAmtForClose
      ) {
        return prev
      }
      
      return {
        ...prev,
        // CRITICAL: Preserve loanDate - it's the original loan date from database, never changes
        loanDate: prev.loanDate, // Explicitly preserve original loan date
        dueDays: calculated.dueDays,
        penalty: calculated.penalty,
        totalAmtForRenewal: calculated.totalAmtForRenewal,
        totalAmtForClose: calculated.totalAmtForClose,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.dueDate, formData.date, formData.loanAmount, formData.loanDate, ledgerTransactions?.length])

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
      // CRITICAL: The database has a 'date' field which is the ORIGINAL loan date
      // We MUST preserve this as loanDate for interest calculation (NEVER changes)
      // The form's 'date' field should be "today" for due days calculation (user can change)
      
      // The database 'date' field is the original loan date - preserve it in loanDate
      const originalLoanDate = data.date // Original loan date from DB (always use data.date, database doesn't have loanDate field)
      
      // Extract date field before spreading data, so we don't overwrite form's "today" date field
      const { date: dbOriginalDate, ...loanDataWithoutDate } = data
      
      setFormData(prev => ({
        ...loanDataWithoutDate, // Spread all loan data EXCEPT the original date field
        receiptNo: data.receiptNo || data.number,
        rate: data.rate || data.rateOfInterest,
        // CRITICAL: Preserve original loan date from database in loanDate field
        // This is the ORIGINAL loan date from DB (never changes, used for interest calculation)
        loanDate: originalLoanDate,
        // Keep form's "today" date separate - user can change this for due days calculation
        // Don't overwrite if user has already set it, otherwise use actual today
        date: prev.date && prev.date !== dbOriginalDate ? prev.date : new Date().toISOString().split('T')[0],
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

  const handleRenewal = async () => {
    if (!selectedAccount || !formData.totalAmtForRenewal || formData.totalAmtForRenewal <= 0) {
      alert('Please select an account and ensure renewal amount is valid')
      return
    }

    const renewalAmount = formData.totalAmtForRenewal
    const confirmMessage = `Renew loan for ${formData.customerName || 'this account'}?\n\n` +
      `Renewal Amount: ₹${formatCurrency(renewalAmount)}\n\n` +
      `This will:\n` +
      `1. Record a payment transaction of ₹${formatCurrency(renewalAmount)}\n` +
      `2. Update loan dates (Loan Date = Today, Due Date = Today + Period)\n` +
      `3. Reset interest and penalty calculations\n\n` +
      `Continue?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const renewalDate = formData.date || new Date().toISOString().split('T')[0]
      
      // Calculate new due date: renewal date + period (default 365 days if period not set)
      const periodDays = formData.period || 365
      const renewalDateObj = new Date(renewalDate + 'T00:00:00')
      renewalDateObj.setDate(renewalDateObj.getDate() + periodDays)
      const newDueDate = renewalDateObj.toISOString().split('T')[0]

      // Step 1: Create payment transaction (debit entry)
      // Don't include id - database will generate UUID
      const transaction = {
        id: '', // Will be generated by database
        date: renewalDate,
        accountName: formData.customerName || `CD-${formData.number || formData.receiptNo}`,
        particulars: `Loan Renewal - CD-${formData.number || formData.receiptNo || ''} - ${formData.customerName || ''}`,
        number: String(formData.number || formData.receiptNo || ''),
        debit: renewalAmount,
        credit: 0,
        userName: 'RAMESH',
        entryTime: new Date().toISOString(),
      }

      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })

      if (!transactionResponse.ok) {
        const error = await transactionResponse.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      // Step 2: Update loan with new dates
      const updatedLoan = {
        ...formData,
        loanDate: renewalDate,
        dueDate: newDueDate,
        // Keep the same loan number and amount, just reset dates
      }

      const loanResponse = await fetch(`/api/loans/${selectedAccount}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLoan),
      })

      if (!loanResponse.ok) {
        const error = await loanResponse.json()
        throw new Error(error.error || 'Failed to update loan')
      }

      alert(`Loan renewed successfully!\n\nPayment recorded: ₹${formatCurrency(renewalAmount)}\nNew Due Date: ${new Date(newDueDate).toLocaleDateString()}`)
      
      // Refresh data
      await fetchAccountDetails(selectedAccount)
      await fetchLedgerTransactions(selectedAccount)
      await fetchAccounts()
    } catch (error: any) {
      console.error('Error renewing loan:', error)
      alert(`Error renewing loan: ${error.message || 'Unknown error'}`)
    }
  }

  const handlePartialPaymentAndRenewal = async () => {
    if (!selectedAccount || !formData.totalAmtForRenewal || formData.totalAmtForRenewal <= 0) {
      alert('Please select an account and ensure renewal amount is valid')
      return
    }

    // Prompt for partial payment amount
    const paymentInput = prompt(
      `Enter partial payment amount for renewal:\n\n` +
      `Total Renewal Amount: ₹${formatCurrency(formData.totalAmtForRenewal)}\n` +
      `Remaining balance after payment will be carried forward.\n\n` +
      `Enter amount:`,
      '0'
    )

    if (!paymentInput) {
      return // User cancelled
    }

    const paymentAmount = parseFloat(paymentInput)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    if (paymentAmount > formData.totalAmtForRenewal) {
      alert(`Payment amount cannot exceed renewal amount of ₹${formatCurrency(formData.totalAmtForRenewal)}`)
      return
    }

    const remainingBalance = formData.totalAmtForRenewal - paymentAmount
    const confirmMessage = `Process partial payment and renewal?\n\n` +
      `Payment Amount: ₹${formatCurrency(paymentAmount)}\n` +
      `Remaining Balance: ₹${formatCurrency(remainingBalance)}\n\n` +
      `This will:\n` +
      `1. Record payment transaction of ₹${formatCurrency(paymentAmount)}\n` +
      `2. Update loan dates (renewal)\n` +
      `3. Remaining balance will be added to new loan principal\n\n` +
      `Continue?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const renewalDate = formData.date || new Date().toISOString().split('T')[0]
      
      // Calculate new due date: renewal date + period
      const periodDays = formData.period || 365
      const renewalDateObj = new Date(renewalDate + 'T00:00:00')
      renewalDateObj.setDate(renewalDateObj.getDate() + periodDays)
      const newDueDate = renewalDateObj.toISOString().split('T')[0]

      // Step 1: Create partial payment transaction (debit entry)
      // Don't include id - database will generate UUID
      const transaction = {
        id: '', // Will be generated by database
        date: renewalDate,
        accountName: formData.customerName || `CD-${formData.number || formData.receiptNo}`,
        particulars: `Partial Payment for Renewal - CD-${formData.number || formData.receiptNo || ''} - ${formData.customerName || ''}`,
        number: String(formData.number || formData.receiptNo || ''),
        debit: paymentAmount,
        credit: 0,
        userName: 'RAMESH',
        entryTime: new Date().toISOString(),
      }

      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })

      if (!transactionResponse.ok) {
        const error = await transactionResponse.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      // Step 2: Update loan - add remaining balance to principal and renew
      const newLoanAmount = (formData.loanAmount || 0) + remainingBalance
      const updatedLoan = {
        ...formData,
        loanAmount: newLoanAmount,
        loanDate: renewalDate,
        dueDate: newDueDate,
      }

      const loanResponse = await fetch(`/api/loans/${selectedAccount}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLoan),
      })

      if (!loanResponse.ok) {
        const error = await loanResponse.json()
        throw new Error(error.error || 'Failed to update loan')
      }

      alert(`Partial payment and renewal processed successfully!\n\n` +
        `Payment recorded: ₹${formatCurrency(paymentAmount)}\n` +
        `Remaining balance added to new principal: ₹${formatCurrency(remainingBalance)}\n` +
        `New Loan Amount: ₹${formatCurrency(newLoanAmount)}\n` +
        `New Due Date: ${new Date(newDueDate).toLocaleDateString()}`)
      
      // Refresh data
      await fetchAccountDetails(selectedAccount)
      await fetchLedgerTransactions(selectedAccount)
      await fetchAccounts()
    } catch (error: any) {
      console.error('Error processing partial payment and renewal:', error)
      alert(`Error processing partial payment and renewal: ${error.message || 'Unknown error'}`)
    }
  }

  const handleCloseAccount = async () => {
    if (!selectedAccount || !formData.totalAmtForClose || formData.totalAmtForClose <= 0) {
      alert('Please select an account and ensure close amount is valid')
      return
    }

    const closeAmount = formData.totalAmtForClose
    const confirmMessage = `Close loan account for ${formData.customerName || 'this account'}?\n\n` +
      `Total Amount to Close: ₹${formatCurrency(closeAmount)}\n\n` +
      `This will:\n` +
      `1. Record a payment transaction of ₹${formatCurrency(closeAmount)}\n` +
      `2. Mark the loan as closed\n\n` +
      `Continue?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const closeDate = formData.date || new Date().toISOString().split('T')[0]
      
      // Create payment transaction (debit entry)
      // Don't include id - database will generate UUID
      const transaction = {
        id: '', // Will be generated by database
        date: closeDate,
        accountName: formData.customerName || `CD-${formData.number || formData.receiptNo}`,
        particulars: `Loan Closed - CD-${formData.number || formData.receiptNo || ''} - ${formData.customerName || ''}`,
        number: String(formData.number || formData.receiptNo || ''),
        debit: closeAmount,
        credit: 0,
        userName: 'RAMESH',
        entryTime: new Date().toISOString(),
      }

      const transactionResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })

      if (!transactionResponse.ok) {
        const error = await transactionResponse.json()
        throw new Error(error.error || 'Failed to create transaction')
      }

      alert(`Loan closed successfully!\n\nFinal payment recorded: ₹${formatCurrency(closeAmount)}`)
      
      // Refresh data
      await fetchAccountDetails(selectedAccount)
      await fetchLedgerTransactions(selectedAccount)
      await fetchAccounts()
    } catch (error: any) {
      console.error('Error closing loan:', error)
      alert(`Error closing loan: ${error.message || 'Unknown error'}`)
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
                  <label className="block text-sm font-medium mb-1">Loan Date <span className="text-xs text-gray-500">(Original loan date - from database)</span></label>
                  <input
                    type="date"
                    value={formData.loanDate || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    title="Original loan date from database - used for interest calculation"
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
                <button 
                  onClick={handleRenewal}
                  disabled={!selectedAccount || !formData.totalAmtForRenewal}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md"
                >
                  Renewal Account
                </button>
                <button 
                  onClick={handlePartialPaymentAndRenewal}
                  disabled={!selectedAccount || !formData.totalAmtForRenewal}
                  className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md"
                >
                  Partial Payment and Renewal
                </button>
                <button 
                  onClick={handleCloseAccount}
                  disabled={!selectedAccount || !formData.totalAmtForClose}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md"
                >
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


