'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, Printer, X, Lock, Trash2 } from 'lucide-react'
import { DailyReport, Transaction } from '@/types'
import { format } from 'date-fns'

export default function DailyReportPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [report, setReport] = useState<DailyReport | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [selectedDate])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/daily?date=${selectedDate}`)
      const data = await response.json()
      
      // Check if the response contains an error
      if (data.error) {
        console.error('Error fetching report:', data.error)
        setReport(null)
        alert(`Error: ${data.error}`)
        return
      }
      
      // Ensure data has the expected structure
      if (data && typeof data === 'object' && 'transactions' in data) {
        setReport(data)
      } else {
        console.error('Invalid report data structure:', data)
        setReport(null)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      setReport(null)
      alert('Error fetching daily report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'dd-MMM-yy')
  }

  const formatDateLong = (dateStr: string) => {
    const date = new Date(dateStr)
    return format(date, 'dd MMMM yyyy')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handlePreviousDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const handleNextDate = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
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
              <h1 className="text-2xl font-bold">Daily Report</h1>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">DATE:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={handlePreviousDate}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextDate}
                className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handlePrint}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md">
              Print All
            </button>
            <button
              onClick={() => router.back()}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </button>
            <button className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </button>
            <button className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-md flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Data Grid */}
          <div className="lg:col-span-3 bg-yellow-50 rounded-lg shadow-md p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-yellow-200">
                    <th className="px-3 py-2 text-left border">Date</th>
                    <th className="px-3 py-2 text-left border">Name of the Account</th>
                    <th className="px-3 py-2 text-left border">Particulars</th>
                    <th className="px-3 py-2 text-left border">RNO</th>
                    <th className="px-3 py-2 text-left border">No.</th>
                    <th className="px-3 py-2 text-right border">Credit</th>
                    <th className="px-3 py-2 text-right border">Debit</th>
                    <th className="px-3 py-2 text-left border">UserName</th>
                    <th className="px-3 py-2 text-left border">EntryTime</th>
                  </tr>
                </thead>
                <tbody>
                  {report && report.transactions.length > 0 ? (
                    report.transactions.map((transaction, idx) => (
                      <tr key={idx} className="hover:bg-yellow-100">
                        <td className="px-3 py-2 border">{formatDate(transaction.date)}</td>
                        <td className="px-3 py-2 border">{transaction.accountName}</td>
                        <td className="px-3 py-2 border">{transaction.particulars}</td>
                        <td className="px-3 py-2 border">{transaction.rno || '-'}</td>
                        <td className="px-3 py-2 border">{transaction.number || '-'}</td>
                        <td className="px-3 py-2 border text-right">{formatCurrency(transaction.credit)}</td>
                        <td className="px-3 py-2 border text-right">{formatCurrency(transaction.debit)}</td>
                        <td className="px-3 py-2 border">{transaction.userName}</td>
                        <td className="px-3 py-2 border">{transaction.entryTime}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-3 py-4 text-center text-gray-400 border">
                        No transactions found for this date
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar - Summary */}
          <div className="space-y-4">
            {/* Account Summary */}
            <div className="bg-yellow-50 rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-3 text-gray-800">Account Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-yellow-200">
                      <th className="px-2 py-1 text-left border">Account</th>
                      <th className="px-2 py-1 text-right border">Credit</th>
                      <th className="px-2 py-1 text-right border">Debit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report && report.accountSummary.length > 0 ? (
                      report.accountSummary.map((account, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1 border">{account.accountName}</td>
                          <td className="px-2 py-1 border text-right">{formatCurrency(account.credit)}</td>
                          <td className="px-2 py-1 border text-right">{formatCurrency(account.debit)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-2 py-2 text-center text-gray-400">
                          No accounts
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Today's Total Receipts */}
            {report && report.accountSummary.length > 0 && (
              <div className="bg-yellow-50 rounded-lg shadow-md p-4">
                <h3 className="text-lg font-bold mb-3 text-gray-800">TODAY'S TOTAL RECEIPTS</h3>
                <div className="text-xs space-y-1">
                  {report.transactions
                    .filter(t => t.credit > 0)
                    .map((t, idx) => (
                      <div key={idx} className="flex justify-between border-b pb-1">
                        <span>{t.rno || t.number || '-'}</span>
                        <span className="font-semibold">{formatCurrency(t.credit)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Summary */}
        {report && (
          <div className="mt-6 bg-blue-100 rounded-lg shadow-md p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Credit Total</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(report.creditTotal)}</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Debit Total</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(report.debitTotal)}</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Opening Balance</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(report.openingBalance)}</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Closing Balance</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(report.closingBalance)}</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Grand Total</div>
                <div className="text-xl font-bold text-gray-800">{formatCurrency(report.grandTotal)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



