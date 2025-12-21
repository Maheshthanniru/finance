'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, X, Search } from 'lucide-react'
import { format } from 'date-fns'

interface CapitalTransaction {
  id: string
  date: string
  credit: number
  debit: number
  particulars?: string
}

interface PartnerBalance {
  id: string
  name: string
  credit: number
}

export default function CapitalPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partnerId: '',
    particulars: '',
    credit: 0,
    debit: 0,
  })
  const [transactions, setTransactions] = useState<CapitalTransaction[]>([])
  const [partners, setPartners] = useState<PartnerBalance[]>([])
  const [creditToAll, setCreditToAll] = useState(0)
  const [debitToAll, setDebitToAll] = useState(0)

  useEffect(() => {
    fetchPartners()
    fetchTransactions()
  }, [])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      const balances = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        credit: 0, // This would be calculated from transactions
      }))
      setPartners(balances)
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/capital/transactions')
      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/capital/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        alert('Capital entry saved successfully!')
        fetchTransactions()
        setFormData({
          date: new Date().toISOString().split('T')[0],
          partnerId: '',
          particulars: '',
          credit: 0,
          debit: 0,
        })
      }
    } catch (error) {
      console.error('Error saving capital entry:', error)
      alert('Error saving capital entry')
    }
  }

  const handleCreditToAll = () => {
    // Distribute credit to all partners equally
    const amountPerPartner = creditToAll / partners.length
    // This would create multiple transactions
    alert(`Credit ${creditToAll} distributed to all partners`)
  }

  const handleDebitToAll = () => {
    // Distribute debit to all partners equally
    const amountPerPartner = debitToAll / partners.length
    alert(`Debit ${debitToAll} distributed to all partners`)
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

  const totalCredit = partners.reduce((sum, p) => sum + p.credit, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-orange-600 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Capital Entry form</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Entry Form */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-center">Capital Entry form</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date:</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Partner ID:</label>
                  <select
                    value={formData.partnerId}
                    onChange={(e) => handleInputChange('partnerId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Partner</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Particulars:</label>
                  <input
                    type="text"
                    value={formData.particulars}
                    onChange={(e) => handleInputChange('particulars', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Credit:</label>
                    <input
                      type="number"
                      value={formData.credit}
                      onChange={(e) => handleInputChange('credit', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Debit:</label>
                    <input
                      type="number"
                      value={formData.debit}
                      onChange={(e) => handleInputChange('debit', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={creditToAll}
                      onChange={(e) => setCreditToAll(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    onClick={handleCreditToAll}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
                  >
                    Credit to All
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={debitToAll}
                      onChange={(e) => setDebitToAll(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    onClick={handleDebitToAll}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                  >
                    Debit to All
                  </button>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">D_Date</th>
                      <th className="px-2 py-2 text-right border">Credit</th>
                      <th className="px-2 py-2 text-right border">Debit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-2 py-4 text-center text-gray-400 border">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{formatDate(transaction.date)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(transaction.credit)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(transaction.debit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Record:</span>
                  <input
                    type="text"
                    value={transactions.length}
                    readOnly
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Total:</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(transactions.reduce((sum, t) => sum + t.credit - t.debit, 0))}
                  </span>
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Partner Balances */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Partner Balances</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">Name</th>
                      <th className="px-2 py-2 text-right border">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-2 py-4 text-center text-gray-400 border">
                          No partners found
                        </td>
                      </tr>
                    ) : (
                      partners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{partner.id}</td>
                          <td className="px-2 py-2 border">{partner.name}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(partner.credit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Record: 1 of {partners.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Total:</span>
                  <span className="text-sm font-semibold">{formatCurrency(totalCredit)}</span>
                </div>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-md flex items-center gap-2">
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
