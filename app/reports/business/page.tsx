'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer } from 'lucide-react'
import { format } from 'date-fns'

interface BusinessSummary {
  partnerName: string
  totalLoan: number
  totalPaid: number
  balanceWith: number
  actualLoan: number
  actualPaid: number
  balanceWithout: number
}

interface GeneralBusiness {
  date: string
  number: string
  name: string
  loan: number
  paid: number
  balance: number
}

interface Outstanding {
  date: string
  dueDate: string
  number: string
  loan: number
  paid: number
  balance: number
  days: number
}

export default function BusinessDetailsPage() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState('2013-04-25')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedPartner, setSelectedPartner] = useState<string>('RAMESH BUKKA')
  const [mdDetails, setMdDetails] = useState({
    name: 'RAMESH BUKKA',
    actualLoan: 629605000,
    actualPaid: 511321654,
    actualBalance: 118283346,
    totalLoan: 627617900,
    totalPaid: 511334554,
    totalBalance: 116283346,
  })
  const [totalBusiness, setTotalBusiness] = useState<BusinessSummary[]>([])
  const [generalBusiness, setGeneralBusiness] = useState<GeneralBusiness[]>([])
  const [outstanding, setOutstanding] = useState<Outstanding[]>([])
  const [partners, setPartners] = useState<string[]>([])

  useEffect(() => {
    fetchPartners()
    fetchBusinessDetails()
  }, [fromDate, toDate, selectedPartner])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      setPartners(data.map((p: any) => p.name))
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const fetchBusinessDetails = async () => {
    try {
      const response = await fetch(`/api/reports/business?fromDate=${fromDate}&toDate=${toDate}&partner=${selectedPartner}`)
      const data = await response.json()
      setTotalBusiness(data.totalBusiness || [])
      setGeneralBusiness(data.generalBusiness || [])
      setOutstanding(data.outstanding || [])
      if (data.mdDetails) {
        setMdDetails(data.mdDetails)
      }
    } catch (error) {
      console.error('Error fetching business details:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return format(date, 'dd-MMM-yy')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-orange-600 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Finance Business Details</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - MD Details and Total Business */}
          <div className="lg:col-span-2 space-y-6">
            {/* MD Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">MD</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Actualloan:</label>
                  <input
                    type="text"
                    value={formatCurrency(mdDetails.actualLoan)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ActualPaid:</label>
                  <input
                    type="text"
                    value={formatCurrency(mdDetails.actualPaid)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ActualBalance:</label>
                  <input
                    type="text"
                    value={formatCurrency(mdDetails.actualBalance)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TotalLoan:</label>
                  <input
                    type="text"
                    value={formatCurrency(mdDetails.totalLoan)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TotalPaid:</label>
                  <input
                    type="text"
                    value={formatCurrency(mdDetails.totalPaid)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TotalBalance:</label>
                  <input
                    type="text"
                    value={formatCurrency(mdDetails.totalBalance)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>
              </div>
              <button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2">
                <Printer className="w-4 h-4" />
                MD Business Print
              </button>
            </div>

            {/* Total Business Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Total Business</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">PARTNERNAME</th>
                      <th className="px-2 py-2 text-right border">TotalLoan</th>
                      <th className="px-2 py-2 text-right border">TPaid</th>
                      <th className="px-2 py-2 text-right border">Balance With</th>
                      <th className="px-2 py-2 text-right border">Actual Loan</th>
                      <th className="px-2 py-2 text-right border">APaid</th>
                      <th className="px-2 py-2 text-right border">Balance Without</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalBusiness.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-gray-400 border">
                          No business data found
                        </td>
                      </tr>
                    ) : (
                      totalBusiness.map((business, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{business.partnerName}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(business.totalLoan)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(business.totalPaid)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(business.balanceWith)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(business.actualLoan)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(business.actualPaid)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(business.balanceWithout)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel - General Business and Outstanding */}
          <div className="space-y-6">
            {/* Date Range and Print Options */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">From Date:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Date:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                  Partnerwise Print
                </button>
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                  Total Business Print
                </button>
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                  All Partners Detailed Print All
                </button>
                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
                  Business Print for Meetings
                </button>
              </div>
            </div>

            {/* General Business Table */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-4">{selectedPartner}'s Total Business</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left border">Date</th>
                      <th className="px-2 py-1 text-left border">Number</th>
                      <th className="px-2 py-1 text-left border">Name</th>
                      <th className="px-2 py-1 text-right border">Loan</th>
                      <th className="px-2 py-1 text-right border">Paid</th>
                      <th className="px-2 py-1 text-right border">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalBusiness.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400 border">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      generalBusiness.map((business, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-1 border">{formatDate(business.date)}</td>
                          <td className="px-2 py-1 border">{business.number}</td>
                          <td className="px-2 py-1 border">{business.name}</td>
                          <td className="px-2 py-1 border text-right">{formatCurrency(business.loan)}</td>
                          <td className="px-2 py-1 border text-right">{formatCurrency(business.paid)}</td>
                          <td className="px-2 py-1 border text-right">{formatCurrency(business.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outstanding Table */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-4">{selectedPartner}'s Total Outstanding</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1 text-left border">Date</th>
                      <th className="px-2 py-1 text-left border">DueDate</th>
                      <th className="px-2 py-1 text-left border">Number</th>
                      <th className="px-2 py-1 text-right border">Loan</th>
                      <th className="px-2 py-1 text-right border">Paid</th>
                      <th className="px-2 py-1 text-right border">Balance</th>
                      <th className="px-2 py-1 text-right border">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstanding.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-gray-400 border">
                          No data found
                        </td>
                      </tr>
                    ) : (
                      outstanding.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-2 py-1 border">{formatDate(item.date)}</td>
                          <td className="px-2 py-1 border">{formatDate(item.dueDate)}</td>
                          <td className="px-2 py-1 border">{item.number}</td>
                          <td className="px-2 py-1 border text-right">{formatCurrency(item.loan)}</td>
                          <td className="px-2 py-1 border text-right">{formatCurrency(item.paid)}</td>
                          <td className="px-2 py-1 border text-right">{formatCurrency(item.balance)}</td>
                          <td className="px-2 py-1 border text-right">{item.days}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



