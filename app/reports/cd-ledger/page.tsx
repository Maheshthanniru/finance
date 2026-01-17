'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCw, FileText, X } from 'lucide-react'
import { CDLoan, LedgerTransaction } from '@/types'
import { format } from 'date-fns'
import ImageUpload from '@/components/ImageUpload'
import RenewalModal from '@/components/RenewalModal'

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
  const [renewalModalOpen, setRenewalModalOpen] = useState(false)
  const [renewalMode, setRenewalMode] = useState<'full' | 'partial'>('full')
  const [isProcessingRenewal, setIsProcessingRenewal] = useState(false)
  const [totalAmtPaying, setTotalAmtPaying] = useState<number>(0)
  const [nextDueDate, setNextDueDate] = useState<string>('')

  useEffect(() => {
    fetchAccounts()
    // Set current time on client side only to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString())
  }, [])

  const calculateLoanDetails = (loan: any, transactions: LedgerTransaction[]) => {
    // Use the form's "Today's Date" field for calculations, not actual current date
    // This allows calculations to be based on the date selected in the form
    const todayDateStr = loan.date || new Date().toISOString().split('T')[0]
    const today = new Date(todayDateStr + 'T00:00:00')
    today.setHours(0, 0, 0, 0)
    
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
    // Parse due date correctly - handle YYYY-MM-DD format
    const dueDate = loan.dueDate ? new Date(loan.dueDate + 'T00:00:00') : null
    
    // Calculate due days (days between loan date and due date) - the loan period
    // Due Days = Due Date - Loan Date (shows the period from loan date to due date)
    let dueDays = 0
    if (loanDate && dueDate && !isNaN(loanDate.getTime()) && !isNaN(dueDate.getTime())) {
      // Calculate difference in milliseconds: Due Date - Loan Date
      const diffTime = dueDate.getTime() - loanDate.getTime()
      // Convert to days (86400000 ms = 1 day)
      const daysDiff = diffTime / (1000 * 60 * 60 * 24)
      // Round down and ensure non-negative
      dueDays = Math.max(0, Math.floor(daysDiff))
    }
    
    // Calculate amount paid from ledger transactions (sum of debits)
    const amountPaid = transactions.reduce((sum, t) => sum + t.debit, 0)
    
    // Get rate of interest (use rate if available, otherwise use rateOfInterest, default to 12%)
    const rate = loan.rate || loan.rateOfInterest || 12
    
    // IMPORTANT: Calculate interest based on period from ORIGINAL LOAN DATE to TODAY'S DATE (form date)
    // Interest continues to accrue from loan date until today (as shown in image)
    // CRITICAL: loanDate MUST be the original loan date from database
    // Use the form's "Today's Date" for interest calculation, not due date
    let periodDays = 0
    if (loanDate && !isNaN(loanDate.getTime()) && !isNaN(today.getTime())) {
      // Calculate period from ORIGINAL loan date to TODAY (form's date field)
      const diffTime = today.getTime() - loanDate.getTime()
      periodDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    } else if (loan.period) {
      // If period couldn't be calculated from dates, use stored period field
      periodDays = loan.period
    } else {
      // Default: calculate from loan date to today
      const diffTime = today.getTime() - loanDate!.getTime()
      periodDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
    }
    
    // Calculate present interest based on period from loan date to today (form date)
    // Interest continues accruing from loan date until today
    // Formula: (Loan Amount * Rate * Period in days) / (100 * 365)
    // Daily interest calculation: Principal * (Rate/100) * (Days/365)
    const presentInterest = (loan.loanAmount * rate * periodDays) / (100 * 365)
    
    // Calculate total balance: Loan Amount + Interest - Amount Paid
    const totalBalance = loan.loanAmount + presentInterest - amountPaid
    
    // Calculate penalty: Based on overdue days (days past due date)
    // Penalty applies if the loan is overdue
    let penalty = 0
    let overdueDays = 0
    if (dueDate && !isNaN(dueDate.getTime()) && !isNaN(today.getTime())) {
      // Calculate overdue days: Today (form date) - Due Date (positive if overdue)
      const overdueDiff = today.getTime() - dueDate.getTime()
      overdueDays = Math.max(0, Math.floor(overdueDiff / (1000 * 60 * 60 * 24)))
    }
    
    // Calculate penalty: Based on overdue days and principal balance
    // Formula: (Principal * Rate * Overdue Period in days) / (100 * 365)
    // Penalty = Interest on principal for overdue period (daily calculation)
    if (overdueDays > 0 && loan.loanAmount > 0) {
      // Penalty is calculated as interest on principal for overdue period
      // Using same rate as loan interest rate, calculated daily
      penalty = (loan.loanAmount * rate * overdueDays) / (100 * 365)
    }
    
    // Calculate total amount for renewal: Interest + Penalty (principal not included in renewal amount)
    // When renewing, customer pays only interest + penalty, principal rolls over
    // Based on image: Total Amt. for Ren = Interest + Penalty (without principal)
    const totalAmtForRenewal = presentInterest + penalty - amountPaid
    
    // Calculate total amount for close: Principal + Interest + Penalty - Amount Paid
    // When closing, customer pays full amount including principal
    // Based on image: Total Amt for Close = Loan Amount + Interest + Penalty
    const totalAmtForClose = loan.loanAmount + presentInterest + penalty - amountPaid
    
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

  // Calculate loan details automatically when loan data, transactions, or date changes
  useEffect(() => {
    // CRITICAL: Don't calculate if loanDate is not set yet (loan hasn't been fully loaded)
    if (!selectedAccount || !formData.loanDate || formData.loanAmount === undefined || formData.loanAmount <= 0 || !Array.isArray(ledgerTransactions)) {
      return
    }
    
    // Calculate using form's date field (allows date-based calculations)
    const calculated = calculateLoanDetails(formData, ledgerTransactions)
    
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
  }, [selectedAccount, formData.loanAmount, formData.rate, formData.rateOfInterest, formData.period, formData.loanDate, JSON.stringify(ledgerTransactions)])

  // Recalculate when date field changes (to update all date-based calculations)
  useEffect(() => {
    // CRITICAL: Don't calculate if loanDate is not set yet (loan hasn't been fully loaded)
    if (!selectedAccount || !formData.loanDate || !formData.loanAmount || formData.loanAmount <= 0 || !Array.isArray(ledgerTransactions)) {
      return
    }
    
    setFormData(prev => {
      // Recalculate all values using form's "Today's Date" field
      const calculated = calculateLoanDetails(prev, ledgerTransactions)
      
      // Only update if values changed to prevent infinite loops
      const hasChanges = 
        prev.amountPaid !== calculated.amountPaid ||
        prev.presentInterest !== calculated.presentInterest ||
        prev.totalBalance !== calculated.totalBalance ||
        prev.dueDays !== calculated.dueDays ||
        prev.penalty !== calculated.penalty ||
        prev.totalAmtForRenewal !== calculated.totalAmtForRenewal ||
        prev.totalAmtForClose !== calculated.totalAmtForClose
      
      if (!hasChanges) return prev
      
      return {
        ...prev,
        // CRITICAL: Preserve loanDate - it's the original loan date from database, never changes
        loanDate: prev.loanDate,
        // Update all calculated fields based on form's date
        amountPaid: calculated.amountPaid,
        presentInterest: calculated.presentInterest,
        totalBalance: calculated.totalBalance,
        dueDays: calculated.dueDays,
        penalty: calculated.penalty,
        totalAmtForRenewal: calculated.totalAmtForRenewal,
        totalAmtForClose: calculated.totalAmtForClose,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.date, formData.dueDate, formData.loanAmount, formData.loanDate, formData.period, formData.rate, formData.rateOfInterest, ledgerTransactions?.length, JSON.stringify(ledgerTransactions)])

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
      
      // The database 'date' field is the original loan date - preserve it in loanDate
      const originalLoanDate = data.date // Original loan date from DB (always use data.date, database doesn't have loanDate field)
      
      setFormData(prev => ({
        ...data, // Spread all loan data (including date field from DB, but it's not used for calculations)
        receiptNo: data.receiptNo || data.number,
        rate: data.rate || data.rateOfInterest,
        // CRITICAL: Preserve original loan date from database in loanDate field
        // This is the ORIGINAL loan date from DB (never changes, used for interest calculation)
        loanDate: originalLoanDate,
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

  const handleRenewalClick = () => {
    if (!selectedAccount || !formData.totalAmtForRenewal || formData.totalAmtForRenewal <= 0) {
      alert('Please select an account and ensure renewal amount is valid')
      return
    }
    setRenewalMode('full')
    setRenewalModalOpen(true)
  }

  const handlePartialRenewalClick = () => {
    if (!selectedAccount || !formData.totalAmtForRenewal || formData.totalAmtForRenewal <= 0) {
      alert('Please select an account and ensure renewal amount is valid')
      return
    }
    setRenewalMode('partial')
    setRenewalModalOpen(true)
  }

  const handleRenewalConfirm = async (amount: number, isPartial: boolean) => {
    setIsProcessingRenewal(true)
    try {
      const renewalDate = new Date().toISOString().split('T')[0]
      const periodDays = formData.period || 365
      const renewalDateObj = new Date(renewalDate + 'T00:00:00')
      renewalDateObj.setDate(renewalDateObj.getDate() + periodDays)
      const newDueDate = renewalDateObj.toISOString().split('T')[0]

      if (isPartial) {
        // Partial payment and renewal
        const remainingBalance = formData.totalAmtForRenewal! - amount

        // Step 1: Create partial payment transaction
        const transaction = {
          id: '',
          date: renewalDate,
          accountName: formData.customerName || `CD-${formData.number || formData.receiptNo}`,
          particulars: `Partial Payment for Renewal - CD-${formData.number || formData.receiptNo || ''} - ${formData.customerName || ''}`,
          number: String(formData.number || formData.receiptNo || ''),
          debit: amount,
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

        // Success message
        const successMsg = `Partial payment and renewal processed successfully!\n\n` +
          `Payment recorded: ₹${formatCurrency(amount)}\n` +
          `Remaining balance added to new principal: ₹${formatCurrency(remainingBalance)}\n` +
          `New Loan Amount: ₹${formatCurrency(newLoanAmount)}\n` +
          `New Due Date: ${new Date(newDueDate).toLocaleDateString()}`
        
        alert(successMsg)
      } else {
        // Full renewal
        const transaction = {
          id: '',
          date: renewalDate,
          accountName: formData.customerName || `CD-${formData.number || formData.receiptNo}`,
          particulars: `Loan Renewal - CD-${formData.number || formData.receiptNo || ''} - ${formData.customerName || ''}`,
          number: String(formData.number || formData.receiptNo || ''),
          debit: amount,
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

        const successMsg = `Loan renewed successfully!\n\n` +
          `Payment recorded: ₹${formatCurrency(amount)}\n` +
          `New Due Date: ${new Date(newDueDate).toLocaleDateString()}`
        
        alert(successMsg)
      }

      // Close modal and refresh data
      setRenewalModalOpen(false)
      await fetchAccountDetails(selectedAccount)
      await fetchLedgerTransactions(selectedAccount)
      await fetchAccounts()
    } catch (error: any) {
      console.error('Error processing renewal:', error)
      alert(`Error processing renewal: ${error.message || 'Unknown error'}`)
    } finally {
      setIsProcessingRenewal(false)
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
      const closeDate = new Date().toISOString().split('T')[0] // Always use actual current date
      
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

  // Calculate Days (days from loan date to form's "Today's Date")
  const calculateDays = (): number => {
    if (!formData.loanDate) return 0
    const loanDate = new Date(formData.loanDate + 'T00:00:00')
    // Use form's "Today's Date" field, not actual current date
    const todayDateStr = formData.date || new Date().toISOString().split('T')[0]
    const today = new Date(todayDateStr + 'T00:00:00')
    today.setHours(0, 0, 0, 0)
    if (isNaN(loanDate.getTime()) || isNaN(today.getTime())) return 0
    const diffTime = today.getTime() - loanDate.getTime()
    return Math.max(0, diffTime / (1000 * 60 * 60 * 24))
  }

  const days = calculateDays()

  // Filter Interest Details transactions (credit transactions with particulars)
  const interestTransactions = ledgerTransactions.filter(t => t.credit > 0)

  // Calculate Next Due Date (if dueDate exists, use it; otherwise calculate from loanDate + period)
  useEffect(() => {
    if (formData.dueDate) {
      setNextDueDate(formData.dueDate)
    } else if (formData.loanDate && formData.period) {
      const loanDate = new Date(formData.loanDate + 'T00:00:00')
      loanDate.setDate(loanDate.getDate() + formData.period)
      setNextDueDate(loanDate.toISOString().split('T')[0])
    } else {
      setNextDueDate(formData.dueDate || formData.date || '')
    }
  }, [formData.dueDate, formData.loanDate, formData.period, formData.date])

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
          <button
            onClick={() => router.push('/reports/stbd-ledger')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md"
          >
            Goto STBD Ledger
          </button>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT COLUMN - Customer Details */}
          <div className="space-y-4">
            {/* Today's Date */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium mb-2">Today's Date</label>
              <input
                type="date"
                value={formData.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* A/c Number with Days */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-end gap-2 mb-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">A/c Number</label>
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
                <div className="w-24">
                  <label className="block text-sm font-medium mb-1">Days</label>
                  <input
                    type="text"
                    value={days.toFixed(1)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-right"
                  />
                </div>
              </div>
              {selectedAccount && formData.number && (
                <div className="text-sm text-gray-600 mt-1">
                  {formData.number}
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.customerName || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">S/o W/o</label>
                  <input
                    type="text"
                    value={formData.fatherName || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData.address || ''}
                    readOnly
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone No 1</label>
                  <input
                    type="tel"
                    value={formData.phone1 || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone No 2</label>
                  <input
                    type="tel"
                    value={formData.phone2 || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adhaar</label>
                  <input
                    type="text"
                    value={formData.aadhaar || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Partner</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.partnerName || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    {formData.partnerId && (
                      <input
                        type="text"
                        value={formData.partnerId || ''}
                        readOnly
                        className="w-12 px-2 py-2 border border-gray-300 rounded-md bg-gray-50 text-center"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN - Payment & Loan Details */}
          <div className="space-y-4">
            {/* Total Amt Paying, Receipt No, Rate */}
            <div className="bg-white rounded-lg shadow-md p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Total Amt Paying</label>
                <input
                  type="number"
                  value={totalAmtPaying}
                  onChange={(e) => setTotalAmtPaying(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Receipt No</label>
                <input
                  type="number"
                  value={formData.receiptNo || formData.number || ''}
                  onChange={(e) => handleInputChange('receiptNo', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rate || formData.rateOfInterest || ''}
                  onChange={(e) => handleInputChange('rate', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <button 
                onClick={handleRenewalClick}
                disabled={!selectedAccount || !formData.totalAmtForRenewal || isProcessingRenewal}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-semibold transition-colors"
              >
                Renewal Account
              </button>
              <button 
                onClick={handlePartialRenewalClick}
                disabled={!selectedAccount || !formData.totalAmtForRenewal || isProcessingRenewal}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-semibold transition-colors"
              >
                Partial Payment and Renewal
              </button>
              <button 
                onClick={handleCloseAccount}
                disabled={!selectedAccount || !formData.totalAmtForClose || isProcessingRenewal}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-semibold transition-colors"
              >
                Close Account
              </button>
            </div>

            {/* Loan Summary */}
            <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <h3 className="text-sm font-bold mb-2">Loan Summary</h3>
              <div>
                <label className="block text-xs font-medium mb-1">Loan Amount</label>
                <input
                  type="text"
                  value={formatCurrency(formData.loanAmount || 0)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Amount Paid</label>
                <input
                  type="text"
                  value={formatCurrency(formData.amountPaid || 0)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Present Interest</label>
                <input
                  type="text"
                  value={formatCurrency(formData.presentInterest || 0)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Total Bal</label>
                <input
                  type="text"
                  value={formatCurrency(formData.totalBalance || 0)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Document Status</label>
                <input
                  type="text"
                  value={formData.documentStatus || ''}
                  onChange={(e) => handleInputChange('documentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Loan Dates & Calculated Amounts */}
            <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Loan Date</label>
                  <input
                    type="text"
                    value={formData.loanDate ? formatDate(formData.loanDate) : ''}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Due Date</label>
                  <input
                    type="text"
                    value={formData.dueDate ? formatDate(formData.dueDate) : ''}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Due Days</label>
                  <input
                    type="text"
                    value={formData.dueDays || 0}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-xs text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Next DueDt</label>
                  <input
                    type="text"
                    value={nextDueDate ? formatDate(nextDueDate) : ''}
                    readOnly
                    className="w-full px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-xs"
                  />
                </div>
              </div>
              <div className="pt-2 space-y-1 border-t">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Amount:</span>
                  <span className="text-right">{formatCurrency(formData.loanAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Interest:</span>
                  <span className="text-right">{formatCurrency(formData.presentInterest || 0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Penalty:</span>
                  <span className="text-right">{formatCurrency(formData.penalty || 0)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold bg-red-50 px-2 py-1 rounded">
                  <span>Total Amt. for Ren:</span>
                  <span className="text-right">{formatCurrency(formData.totalAmtForRenewal || 0)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold bg-pink-50 px-2 py-1 rounded">
                  <span>Total Amt for Close:</span>
                  <span className="text-right">{formatCurrency(formData.totalAmtForClose || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Guarantors & Images */}
          <div className="space-y-4">
            {/* Document Returned Button */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold">
                Document Returned
              </button>
            </div>

            {/* Guarantor 1 */}
            <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <h3 className="text-sm font-bold">Guarantor 1</h3>
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.guarantor1?.name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone No</label>
                <input
                  type="tel"
                  value={formData.guarantor1?.phone || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Adhaar</label>
                <input
                  type="text"
                  value={formData.guarantor1?.aadhaar || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            {/* Guarantor 2 */}
            <div className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <h3 className="text-sm font-bold">Guarantor 2</h3>
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.guarantor2?.name || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Phone No</label>
                <input
                  type="tel"
                  value={formData.guarantor2?.phone || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Adhaar</label>
                <input
                  type="text"
                  value={formData.guarantor2?.aadhaar || ''}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>

            {/* Document Type */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <label className="block text-sm font-medium mb-2">Document Type</label>
              <input
                type="text"
                value={formData.documentType || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>

            {/* Images */}
            {selectedAccount && (
              <div className="space-y-4">
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
                  label="Surity Person"
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
          </div>
        </div>

        {/* Bottom Tables Section */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Details Table (Left) */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-sm font-bold mb-2">Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left border">Date</th>
                    <th className="px-2 py-1 text-left border">A/c Name</th>
                    <th className="px-2 py-1 text-right border">Credit</th>
                    <th className="px-2 py-1 text-right border">Debit</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-2 text-center text-gray-400 border">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    ledgerTransactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-2 py-1 border">{formatDate(transaction.date)}</td>
                        <td className="px-2 py-1 border">{transaction.particulars || '-'}</td>
                        <td className="px-2 py-1 border text-right">{formatCurrency(transaction.credit)}</td>
                        <td className="px-2 py-1 border text-right">{formatCurrency(transaction.debit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interest Details Table (Right) */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold">Interest Details</h3>
              <div className="flex gap-2">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs">
                  Open Report
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">
                  NPA Close
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-2 py-1 text-left border">DATE</th>
                    <th className="px-2 py-1 text-right border">Credit</th>
                    <th className="px-2 py-1 text-left border">RNO</th>
                    <th className="px-2 py-1 text-left border">Particulars</th>
                  </tr>
                </thead>
                <tbody>
                  {interestTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-2 text-center text-gray-400 border">
                        No interest transactions found
                      </td>
                    </tr>
                  ) : (
                    interestTransactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-2 py-1 border">{formatDate(transaction.date)}</td>
                        <td className="px-2 py-1 border text-right">{formatCurrency(transaction.credit)}</td>
                        <td className="px-2 py-1 border">{transaction.rno || '-'}</td>
                        <td className="px-2 py-1 border">{transaction.particulars || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>


      {/* Renewal Modal */}
      {renewalModalOpen && (
        <RenewalModal
          isOpen={renewalModalOpen}
          onClose={() => !isProcessingRenewal && setRenewalModalOpen(false)}
          onConfirm={handleRenewalConfirm}
          mode={renewalMode}
          totalRenewalAmount={formData.totalAmtForRenewal || 0}
          customerName={formData.customerName}
          loanNumber={formData.number || formData.receiptNo}
          currentLoanAmount={formData.loanAmount || 0}
          isLoading={isProcessingRenewal}
        />
      )}
    </div>
  )
}


