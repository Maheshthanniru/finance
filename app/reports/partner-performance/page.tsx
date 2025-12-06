'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

interface PartnerPerformance {
  totalLoans: number
  totalLoanAmount: number
  totalPaid: number
  commission: number
  documentCharges: number
  penalty: number
}

export default function PartnerPerformancePage() {
  const router = useRouter()
  const [partners, setPartners] = useState<string[]>([])
  const [selectedPartner, setSelectedPartner] = useState<string>('')
  const [fromDate, setFromDate] = useState('2017-05-01')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [toPartnerPercent, setToPartnerPercent] = useState(30)
  const [toOfficePercent, setToOfficePercent] = useState(30)
  const [performance, setPerformance] = useState<PartnerPerformance | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPartners()
  }, [])

  useEffect(() => {
    if (selectedPartner) {
      fetchPartnerPerformance()
    }
  }, [selectedPartner, fromDate, toDate])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      setPartners(data.map((p: any) => p.name))
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const fetchPartnerPerformance = async () => {
    if (!selectedPartner) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('partner', selectedPartner)
      params.append('fromDate', fromDate)
      params.append('toDate', toDate)

      const response = await fetch(`/api/reports/partner-performance?${params.toString()}`)
      const data = await response.json()
      setPerformance(data.partnerPerformance)
    } catch (error) {
      console.error('Error fetching partner performance:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Partner Performance</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Partner Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-4">PARTNER NAME</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {partners.map((partner, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPartner(partner)}
                    className={`w-full text-left px-4 py-2 rounded-md ${
                      selectedPartner === partner
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {partner}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Panel - Date Range and Performance Options */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6 flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">From:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="mb-6 flex items-center gap-4">
                <button
                  onClick={fetchPartnerPerformance}
                  disabled={!selectedPartner || loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  {loading ? 'Loading...' : 'Load Performance'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
              </div>

              {performance && selectedPartner && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h4 className="text-lg font-bold mb-3">{selectedPartner} Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Loans</div>
                      <div className="text-xl font-bold">{performance.totalLoans}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Loan Amount</div>
                      <div className="text-xl font-bold">{formatCurrency(performance.totalLoanAmount)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Commission</div>
                      <div className="text-xl font-bold">{formatCurrency(performance.commission)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Document Charges</div>
                      <div className="text-xl font-bold">{formatCurrency(performance.documentCharges)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Penalty</div>
                      <div className="text-xl font-bold">{formatCurrency(performance.penalty)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Paid</div>
                      <div className="text-xl font-bold">{formatCurrency(performance.totalPaid)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  All Partner Performances
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Selected Partner Commission Details
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Selected Partner DOC Details
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Selected Partner PNALTY Details
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  Receipts
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                  All Partner Details
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Total Partners:</label>
                  <input
                    type="text"
                    value={partners.length}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Partner %:</label>
                  <input
                    type="number"
                    value={toPartnerPercent}
                    onChange={(e) => setToPartnerPercent(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Office %:</label>
                  <input
                    type="number"
                    value={toOfficePercent}
                    onChange={(e) => setToOfficePercent(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
