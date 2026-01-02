'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { DayBookEntry } from '@/types'
import { format } from 'date-fns'

export default function DayBookPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState<DayBookEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDayBook()
  }, [selectedDate])

  const fetchDayBook = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/daybook?date=${selectedDate}`)
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error fetching day book:', errorData)
        alert(`Error: ${errorData.error || 'Failed to fetch day book'}`)
        setEntries([])
        return
      }
      const data = await response.json()
      // Check if data is an array, if not, it might be an error object
      if (Array.isArray(data)) {
        setEntries(data)
      } else if (data.error) {
        console.error('Error from API:', data.error)
        alert(`Error: ${data.error}`)
        setEntries([])
      } else {
        console.error('Unexpected data format:', data)
        setEntries([])
      }
    } catch (error) {
      console.error('Error fetching day book:', error)
      alert('Error fetching day book. Please check the console for details.')
      setEntries([])
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

  const creditTotal = entries.reduce((sum, e) => sum + e.credit, 0)
  const debitTotal = entries.reduce((sum, e) => sum + e.debit, 0)

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
              <h1 className="text-2xl font-bold">Day Book</h1>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white text-gray-800 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
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
        {/* Company Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800">TIRUMALA FINANCE</h2>
          <p className="text-gray-600">Gaimel, Dist: Siddipet, Telangana</p>
          <p className="text-lg font-semibold mt-2">Day Book</p>
          <p className="text-gray-600">{format(new Date(selectedDate), 'dd MMMM yyyy')}</p>
        </div>

        {/* Day Book Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left border font-semibold">SN</th>
                  <th className="px-4 py-3 text-left border font-semibold">Head of A/c</th>
                  <th className="px-4 py-3 text-left border font-semibold">Particulars</th>
                  <th className="px-4 py-3 text-left border font-semibold">No.</th>
                  <th className="px-4 py-3 text-right border font-semibold">Credit</th>
                  <th className="px-4 py-3 text-right border font-semibold">Debit</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                      No entries found for this date
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.sn} className="hover:bg-gray-50 border-t">
                      <td className="px-4 py-3 border">{entry.sn}</td>
                      <td className="px-4 py-3 border">{entry.headOfAccount}</td>
                      <td className="px-4 py-3 border">{entry.particulars}</td>
                      <td className="px-4 py-3 border">{entry.number || '-'}</td>
                      <td className="px-4 py-3 border text-right">{formatCurrency(entry.credit)}</td>
                      <td className="px-4 py-3 border text-right">{formatCurrency(entry.debit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={4} className="px-4 py-3 border text-right">Total:</td>
                  <td className="px-4 py-3 border text-right">{formatCurrency(creditTotal)}</td>
                  <td className="px-4 py-3 border text-right">{formatCurrency(debitTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}



