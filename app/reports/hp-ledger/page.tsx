'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCw } from 'lucide-react'
import { STBDLoan, Installment, LedgerTransaction } from '@/types'
import { format } from 'date-fns'

export default function HPLedgerPage() {
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [formData, setFormData] = useState<Partial<STBDLoan>>({
    date: new Date().toISOString().split('T')[0],
    loanType: 'HP',
    loanAmount: 0,
    installmentAmount: 0,
    totalInstallments: 0,
    totalAmount: 0,
    lateFees: 0,
    totalPayable: 0,
  })
  const [installments, setInstallments] = useState<Installment[]>([])
  const [ledgerTransactions, setLedgerTransactions] = useState<LedgerTransaction[]>([])
  const [accounts, setAccounts] = useState<STBDLoan[]>([])

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountDetails(selectedAccount)
      fetchInstallments(selectedAccount)
      fetchLedgerTransactions(selectedAccount)
    }
  }, [selectedAccount])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/loans?type=HP')
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

  const fetchInstallments = async (accountId: string) => {
    try {
      const response = await fetch(`/api/loans/${accountId}/installments`)
      const data = await response.json()
      setInstallments(data)
    } catch (error) {
      console.error('Error fetching installments:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">HP LEDGER</h1>
            </div>
            <div className="text-right">
              <div className="text-sm">User Name: RAMESH</div>
              <div className="text-sm">{new Date().toLocaleString()}</div>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Inst. Paying Receipt No:</label>
                  <input
                    type="number"
                    value={formData.instPayingReceiptNo || 0}
                    onChange={(e) => handleInputChange('instPayingReceiptNo', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
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
                  <label className="block text-sm font-medium mb-1">Phone No:</label>
                  <input
                    type="tel"
                    value={formData.phone1 || ''}
                    onChange={(e) => handleInputChange('phone1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Guarantor</label>
                  <input
                    type="text"
                    value={formData.guarantor1?.name || ''}
                    onChange={(e) => handleInputChange('guarantor1', { ...formData.guarantor1, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Guarantor Phone No:</label>
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

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Financial Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <label className="block text-sm font-medium mb-1">Installment:</label>
                  <input
                    type="number"
                    value={formData.installmentAmount || 0}
                    onChange={(e) => handleInputChange('installmentAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loan Date:</label>
                  <input
                    type="date"
                    value={formData.loanDate || ''}
                    onChange={(e) => handleInputChange('loanDate', e.target.value)}
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
                <div>
                  <label className="block text-sm font-medium mb-1">Total Amount</label>
                  <input
                    type="number"
                    value={formData.totalAmount || 0}
                    onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Penalty</label>
                  <input
                    type="number"
                    value={formData.lateFees || 0}
                    onChange={(e) => handleInputChange('lateFees', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Total Payable</label>
                  <input
                    type="number"
                    value={formData.totalPayable || 0}
                    onChange={(e) => handleInputChange('totalPayable', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-bold"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-4">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-4">Credit/Debit Ledger</h3>
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
                    <tr className="bg-blue-50 font-bold">
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
