'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, RefreshCw, X } from 'lucide-react'
import { format } from 'date-fns'

interface Income {
  accountName: string
  amount: number
}

interface Expense {
  accountName: string
  amount: number
}

export default function ProfitLossPage() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState('2013-04-25')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totalIncomes, setTotalIncomes] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [shareValue, setShareValue] = useState(0)
  const [eachPartnerProfit, setEachPartnerProfit] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProfitLoss()
  }, [fromDate, toDate])

  const fetchProfitLoss = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/profit-loss?fromDate=${fromDate}&toDate=${toDate}`)
      const data = await response.json()
      setIncomes(data.incomes || [])
      setExpenses(data.expenses || [])
      setTotalIncomes(data.totalIncomes || 0)
      setTotalExpenses(data.totalExpenses || 0)
      setTotalProfit(data.totalProfit || 0)
      setShareValue(data.shareValue || 0)
      setEachPartnerProfit(data.eachPartnerProfit || 0)
    } catch (error) {
      console.error('Error fetching profit and loss:', error)
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
              <h1 className="text-2xl font-bold">TIRUMALA FINANCE Profit and Loss Statement</h1>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm mr-2">From:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 bg-white text-gray-800 rounded-md border border-gray-300"
                />
              </div>
              <div>
                <label className="text-sm mr-2">To:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 bg-white text-gray-800 rounded-md border border-gray-300"
                />
              </div>
              <button
                onClick={fetchProfitLoss}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => window.print()}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => router.back()}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Incomes Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-green-700">Incomes</h2>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center text-gray-400 py-4">Loading...</div>
                ) : incomes.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">No income data</div>
                ) : (
                  incomes.map((income, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">{income.accountName}:</span>
                      <span className="font-semibold">{formatCurrency(income.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h2 className="text-xl font-bold mb-4 text-red-700">Expenses</h2>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center text-gray-400 py-4">Loading...</div>
                ) : expenses.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">No expense data</div>
                ) : (
                  expenses.map((expense, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b">
                      <span className="font-medium">{expense.accountName}:</span>
                      <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="mt-8 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Incomes</div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(totalIncomes)}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
                <div className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total Profit</div>
                <div className="text-2xl font-bold text-blue-700">{formatCurrency(totalProfit)}</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Share Value</div>
                <div className="text-2xl font-bold text-purple-700">{formatCurrency(shareValue)}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 md:col-span-2">
                <div className="text-sm text-gray-600 mb-1">Each Partner Profit</div>
                <div className="text-2xl font-bold text-yellow-700">{formatCurrency(eachPartnerProfit)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
