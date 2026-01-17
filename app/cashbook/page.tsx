'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, UserPlus } from 'lucide-react'
import { Transaction } from '@/types'
import { format } from 'date-fns'

interface CashBookEntry extends Transaction {
  accountNumber?: string
}

export default function CashBookEntryPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<CashBookEntry>>({
    date: new Date().toISOString().split('T')[0],
    accountName: '',
    accountNumber: '',
    particulars: '',
    credit: 0,
    debit: 0,
    userName: 'RAMESH',
    entryTime: new Date().toISOString(),
  })
  const [entries, setEntries] = useState<CashBookEntry[]>([])
  const [accountHeads, setAccountHeads] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isNewAccount, setIsNewAccount] = useState(false)

  useEffect(() => {
    fetchEntries()
    fetchAccountHeads()
  }, [])

  const fetchAccountHeads = async () => {
    try {
      const response = await fetch('/api/reports/ledger/accounts')
      if (response.ok) {
        const data = await response.json()
        const uniqueHeads = [...new Set(data.map((acc: any) => acc.aName))].sort()
        setAccountHeads(uniqueHeads)
      }
    } catch (error) {
      console.error('Error fetching account heads:', error)
    }
  }

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/transactions')
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error fetching transactions:', errorData)
        return
      }
      const data = await response.json()
      // Map transactions to cash book entries
      const cashBookEntries: CashBookEntry[] = (data || []).map((t: Transaction, index: number) => ({
        ...t,
        accountNumber: t.number || '',
      }))
      // Sort by date and entry time (newest first)
      cashBookEntries.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.entryTime.localeCompare(a.entryTime)
      })
      setEntries(cashBookEntries)
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CashBookEntry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNewAccount = () => {
    setIsNewAccount(true)
    setFormData(prev => ({
      ...prev,
      accountName: '',
      accountNumber: '',
      particulars: '',
      credit: 0,
      debit: 0,
    }))
  }

  const handleSave = async () => {
    // Validation
    if (!formData.date) {
      alert('Please select a date')
      return
    }
    if (!formData.accountName?.trim()) {
      alert('Please enter Head of A/c')
      return
    }
    if (!formData.particulars?.trim()) {
      alert('Please enter Particulars')
      return
    }
    if ((formData.credit || 0) === 0 && (formData.debit || 0) === 0) {
      alert('Please enter either Credit or Debit amount')
      return
    }
    if ((formData.credit || 0) > 0 && (formData.debit || 0) > 0) {
      alert('Please enter either Credit OR Debit, not both')
      return
    }

    setSaving(true)
    try {
      const transaction: Transaction = {
        date: formData.date!,
        accountName: formData.accountName!,
        particulars: formData.particulars!,
        number: formData.accountNumber || undefined,
        rno: formData.accountNumber || undefined,
        credit: formData.credit || 0,
        debit: formData.debit || 0,
        userName: formData.userName || 'RAMESH',
        entryTime: new Date().toISOString(),
        transactionType: 'cash_book_entry', // Mark as cash book entry
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save entry')
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      alert('Cash book entry saved successfully!')
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        accountName: '',
        accountNumber: '',
        particulars: '',
        credit: 0,
        debit: 0,
        userName: 'RAMESH',
        entryTime: new Date().toISOString(),
      })
      setIsNewAccount(false)
      
      // Refresh entries and account heads
      await fetchEntries()
      await fetchAccountHeads()
      
      // If new account head was added, add it to the list
      if (!accountHeads.includes(formData.accountName!)) {
        setAccountHeads([...accountHeads, formData.accountName!].sort())
      }
    } catch (error: any) {
      console.error('Error saving entry:', error)
      alert(`Error saving entry: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
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
    try {
      const date = new Date(dateStr)
      return format(date, 'dd-MMM-yy')
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="hover:bg-orange-600 p-2 rounded">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Cash Book Entry Form</h1>
                <p className="text-sm opacity-90">TIRUMALA FINANCE - Day Book Entry form</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">User Name: RAMESH</div>
              <div className="text-sm">{new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Entry Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Cash Book Entry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            {/* Head of A/c */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Head of A/c *
              </label>
              {isNewAccount ? (
                <div>
                  <input
                    type="text"
                    value={formData.accountName || ''}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    placeholder="Enter new account name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsNewAccount(false)}
                    className="mt-2 text-sm text-orange-600 hover:text-orange-700"
                  >
                    Or select from existing accounts
                  </button>
                </div>
              ) : (
                <select
                  value={formData.accountName || ''}
                  onChange={(e) => handleInputChange('accountName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                  required
                >
                  <option value="">Select Head of A/c</option>
                  {accountHeads.map((head) => (
                    <option key={head} value={head}>
                      {head}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account_Number
              </label>
              <input
                type="text"
                value={formData.accountNumber || ''}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Optional"
              />
            </div>

            {/* Particulars */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Particulars *
              </label>
              <textarea
                value={formData.particulars || ''}
                onChange={(e) => handleInputChange('particulars', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter particulars"
                required
              />
            </div>

            {/* Credit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.credit || 0}
                onChange={(e) => handleInputChange('credit', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>

            {/* Debit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Debit
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.debit || 0}
                onChange={(e) => handleInputChange('debit', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleNewAccount}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              New Account
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>

        {/* Subform - Transaction History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">Subform</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border font-semibold">ID</th>
                  <th className="px-3 py-2 text-left border font-semibold">Date</th>
                  <th className="px-3 py-2 text-left border font-semibold">Name</th>
                  <th className="px-3 py-2 text-left border font-semibold">Particulars</th>
                  <th className="px-3 py-2 text-right border font-semibold">Debit</th>
                  <th className="px-3 py-2 text-right border font-semibold">Credit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-400 border">
                      Loading...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-400 border">
                      No entries found
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr key={entry.id || index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border">{entry.id?.substring(0, 8) || '-'}</td>
                      <td className="px-3 py-2 border">{formatDate(entry.date)}</td>
                      <td className="px-3 py-2 border">{entry.accountName}</td>
                      <td className="px-3 py-2 border">{entry.particulars}</td>
                      <td className="px-3 py-2 border text-right">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '0.00'}
                      </td>
                      <td className="px-3 py-2 border text-right">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '0.00'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Total Records: {entries.length}
          </div>
        </div>
      </div>
    </div>
  )
}
