'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { format } from 'date-fns'

interface AccountBalance {
  name: string
  cBalance: number
  dBalance: number
}

export default function FinalStatementPage() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState('2013-04-25')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [creditTotal, setCreditTotal] = useState(0)
  const [debitTotal, setDebitTotal] = useState(0)
  const [openingCashBalance, setOpeningCashBalance] = useState(0)
  const [closingCashBalance, setClosingCashBalance] = useState(0)
  const [capital, setCapital] = useState(0)
  const [grandTotal, setGrandTotal] = useState(0)
  const [totalPartners, setTotalPartners] = useState(4)
  const [shareValue, setShareValue] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFinalStatement()
  }, [fromDate, toDate, totalPartners])

  useEffect(() => {
    // Calculate share value when totals change
    const netTotal = grandTotal
    const calculatedShareValue = totalPartners > 0 ? netTotal / totalPartners : 0
    setShareValue(calculatedShareValue)
  }, [grandTotal, totalPartners])

  const fetchFinalStatement = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/final-statement?fromDate=${fromDate}&toDate=${toDate}`)
      const data = await response.json()
      setAccounts(data.accounts || [])
      setCreditTotal(data.creditTotal || 0)
      setDebitTotal(data.debitTotal || 0)
      setOpeningCashBalance(data.openingCashBalance || 0)
      setClosingCashBalance(data.closingCashBalance || 0)
      setCapital(data.capital || 0)
      setGrandTotal(data.grandTotal || 0)
    } catch (error) {
      console.error('Error fetching final statement:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">Final Statement</h1>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm mr-2">Between Dates</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-3 py-2 bg-white text-gray-800 rounded-md border border-gray-300"
                  />
                  <span className="text-white">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-3 py-2 bg-white text-gray-800 rounded-md border border-gray-300"
                  />
                </div>
              </div>
              <button
                onClick={() => window.print()}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Share Value Calculation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Share Value Calculation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Total Loans:</label>
                  <input
                    type="text"
                    value={formatCurrency(creditTotal)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cash:</label>
                  <input
                    type="text"
                    value={formatCurrency(closingCashBalance)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grand Total:</label>
                  <input
                    type="text"
                    value={formatCurrency(grandTotal)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Liabilities</label>
                  <input
                    type="text"
                    value="0.00"
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Net Total:</label>
                  <input
                    type="text"
                    value={formatCurrency(grandTotal)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Partners</label>
                  <input
                    type="number"
                    value={totalPartners}
                    onChange={(e) => setTotalPartners(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SHARE VALUE:</label>
                  <input
                    type="text"
                    value={formatCurrency(shareValue)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Account Balances */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Account Balances</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left border">NAME</th>
                      <th className="px-3 py-2 text-right border">C Balanc</th>
                      <th className="px-3 py-2 text-left border">NAME</th>
                      <th className="px-3 py-2 text-right border">D Balanc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-400 border">
                          Loading...
                        </td>
                      </tr>
                    ) : accounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-400 border">
                          No accounts found
                        </td>
                      </tr>
                    ) : (
                      accounts.map((account, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border">{account.name}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(account.cBalance)}</td>
                          <td className="px-3 py-2 border">{account.name}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(account.dBalance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-3 py-2 border">Credit Total:</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(creditTotal)}</td>
                      <td className="px-3 py-2 border">Debit Total:</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(debitTotal)}</td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="px-3 py-2 border">Opening Cash Balance</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(openingCashBalance)}</td>
                      <td className="px-3 py-2 border">Closing Cash Balance:</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(closingCashBalance)}</td>
                    </tr>
                    <tr className="bg-green-50 font-bold">
                      <td className="px-3 py-2 border">Capital</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(capital)}</td>
                      <td className="px-3 py-2 border">Grand Totals:</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(grandTotal)}</td>
                    </tr>
                    <tr className="bg-yellow-50 font-bold">
                      <td colSpan={2} className="px-3 py-2 border">Grand Total:</td>
                      <td colSpan={2} className="px-3 py-2 border text-right">{formatCurrency(grandTotal)}</td>
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
