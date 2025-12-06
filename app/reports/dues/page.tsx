'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import { NPALoan, LoanType } from '@/types'
import { format } from 'date-fns'

export default function DuesListPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<string[]>([])
  const [selectedPartner, setSelectedPartner] = useState<string>('')
  const [activeReport, setActiveReport] = useState<'outstanding' | 'total-due' | 'cd-due' | 'a-to-b' | 'npa'>('npa')
  const [npaLoans, setNpaLoans] = useState<NPALoan[]>([])
  const [searchAadhaar, setSearchAadhaar] = useState('')
  const [searchName, setSearchName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPartners()
    fetchNPALoans()
  }, [])

  useEffect(() => {
    fetchNPALoans()
  }, [selectedPartner, searchAadhaar, searchName])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      setPartners(data.map((p: any) => p.name))
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const fetchNPALoans = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPartner) params.append('partner', selectedPartner)
      if (searchAadhaar) params.append('aadhaar', searchAadhaar)
      if (searchName) params.append('name', searchName)
      
      const response = await fetch(`/api/reports/npa?${params.toString()}`)
      const data = await response.json()
      setNpaLoans(data)
    } catch (error) {
      console.error('Error fetching NPA loans:', error)
    } finally {
      setLoading(false)
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
      {/* Header */}
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Dues Ledger</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Partner Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-4">PARTNER NAME</h3>
              <div className="space-y-2">
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
                    {idx + 1}. {partner}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Panel - Report Options */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-bold mb-4">Reports</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveReport('outstanding')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeReport === 'outstanding'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Outstanding
                </button>
                <button className="w-full text-left px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">
                  Outstanding Print All
                </button>
                <button
                  onClick={() => setActiveReport('total-due')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeReport === 'total-due'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  TOTAL DUE LIST
                </button>
                <button
                  onClick={() => setActiveReport('cd-due')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeReport === 'cd-due'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  CD DUE LIST
                </button>
                <button
                  onClick={() => setActiveReport('a-to-b')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeReport === 'a-to-b'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  A to B.. DUE LIST
                </button>
                <button
                  onClick={() => setActiveReport('npa')}
                  className={`w-full text-left px-4 py-2 rounded-md ${
                    activeReport === 'npa'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  NPA LIST
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - NPA List Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">NPA LIST</h3>
              
              {/* Search Filters */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Aadhaar:</label>
                  <input
                    type="text"
                    value={searchAadhaar}
                    onChange={(e) => setSearchAadhaar(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Search by Aadhaar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name Search</label>
                  <input
                    type="text"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Search by Name"
                  />
                </div>
              </div>

              {/* NPA Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">Date</th>
                      <th className="px-2 py-2 text-left border">Number</th>
                      <th className="px-2 py-2 text-left border">Name</th>
                      <th className="px-2 py-2 text-right border">NPAAMOUNT</th>
                      <th className="px-2 py-2 text-left border">Adhaar</th>
                      <th className="px-2 py-2 text-left border">Phone</th>
                      <th className="px-2 py-2 text-center border">NPA</th>
                      <th className="px-2 py-2 text-left border">NPADATE</th>
                      <th className="px-2 py-2 text-right border">Am</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="px-2 py-4 text-center text-gray-400 border">
                          Loading...
                        </td>
                      </tr>
                    ) : npaLoans.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-2 py-4 text-center text-gray-400 border">
                          No NPA loans found
                        </td>
                      </tr>
                    ) : (
                      npaLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{formatDate(loan.date)}</td>
                          <td className="px-2 py-2 border">{loan.number}</td>
                          <td className="px-2 py-2 border">{loan.name}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(loan.npaAmount)}</td>
                          <td className="px-2 py-2 border">{loan.aadhaar || '-'}</td>
                          <td className="px-2 py-2 border">{loan.phone || '-'}</td>
                          <td className="px-2 py-2 border text-center">
                            <input
                              type="checkbox"
                              checked={loan.isNPA}
                              readOnly
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-2 py-2 border">{loan.npaDate ? formatDate(loan.npaDate) : '-'}</td>
                          <td className="px-2 py-2 border text-right">{loan.npaAmount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Record: {npaLoans.length > 0 ? '1' : '0'} of {npaLoans.length}
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
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
