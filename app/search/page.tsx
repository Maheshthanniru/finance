'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, RotateCcw } from 'lucide-react'
import { Loan, LoanType } from '@/types'
import { format } from 'date-fns'

export default function SearchPage() {
  const router = useRouter()
  const [searchCriteria, setSearchCriteria] = useState({
    withName: '',
    withPhoneNumber: '',
    withInstallmentAmount: '',
    withLoanAmount: '',
    loanType: '' as LoanType | '',
    number: '',
    ledgerName: '',
    aadhaar: '',
  })
  const [searchMode, setSearchMode] = useState<'normal' | 'aadhaar'>('normal')
  const [foundedRecords, setFoundedRecords] = useState<Loan[]>([])
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)

  const handleInputChange = (field: string, value: any) => {
    setSearchCriteria(prev => ({ ...prev, [field]: value }))
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      if (searchMode === 'aadhaar') {
        // Aadhaar search mode
        const params = new URLSearchParams()
        if (searchCriteria.aadhaar) params.append('aadhaar', searchCriteria.aadhaar)
        if (searchCriteria.withName) params.append('name', searchCriteria.withName)
        
        const response = await fetch(`/api/search/loans?${params.toString()}`)
        const data = await response.json()
        setFoundedRecords(data.allLoans || data.runningLoans || [])
        setTotalRecords((data.allLoans || data.runningLoans || []).length)
      } else {
        // Normal search mode
        const params = new URLSearchParams()
        Object.entries(searchCriteria).forEach(([key, value]) => {
          if (value && key !== 'aadhaar') params.append(key, value.toString())
        })

        const response = await fetch(`/api/search/loans?${params.toString()}`)
        const data = await response.json()
        setFoundedRecords(data.loans || data.allLoans || [])
        setTotalRecords(data.total || (data.loans || data.allLoans || []).length)
      }
    } catch (error) {
      console.error('Error searching loans:', error)
      alert('Error searching loans')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchCriteria({
      withName: '',
      withPhoneNumber: '',
      withInstallmentAmount: '',
      withLoanAmount: '',
      loanType: '',
      number: '',
      ledgerName: '',
      aadhaar: '',
    })
    setFoundedRecords([])
    setTotalRecords(0)
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
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Find</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Mode Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setSearchMode('normal')}
              className={`px-4 py-2 rounded-md ${
                searchMode === 'normal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Normal Search
            </button>
            <button
              onClick={() => setSearchMode('aadhaar')}
              className={`px-4 py-2 rounded-md ${
                searchMode === 'aadhaar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Adhaar Search
            </button>
          </div>
        </div>

        {/* FIND Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">FIND</h2>
          {searchMode === 'aadhaar' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Aadhaar Number</label>
                <input
                  type="text"
                  value={searchCriteria.aadhaar}
                  onChange={(e) => handleInputChange('aadhaar', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter Aadhaar number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name (Optional)</label>
                <input
                  type="text"
                  value={searchCriteria.withName}
                  onChange={(e) => handleInputChange('withName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter name"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">With Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchCriteria.withName}
                  onChange={(e) => handleInputChange('withName', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter name"
                />
                <button
                  onClick={handleReset}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">With Phone Number</label>
              <input
                type="tel"
                value={searchCriteria.withPhoneNumber}
                onChange={(e) => handleInputChange('withPhoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">With Installment Amount</label>
              <input
                type="number"
                value={searchCriteria.withInstallmentAmount}
                onChange={(e) => handleInputChange('withInstallmentAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter installment amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">With Loan Amount</label>
              <input
                type="number"
                value={searchCriteria.withLoanAmount}
                onChange={(e) => handleInputChange('withLoanAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter loan amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loan Type</label>
              <select
                value={searchCriteria.loanType}
                onChange={(e) => handleInputChange('loanType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Types</option>
                <option value="CD">CD</option>
                <option value="STBD">STBD</option>
                <option value="HP">HP</option>
                <option value="TBD">TBD</option>
                <option value="FD">FD</option>
                <option value="OD">OD</option>
                <option value="RD">RD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number</label>
              <input
                type="text"
                value={searchCriteria.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter loan number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ledger Name</label>
              <input
                type="text"
                value={searchCriteria.ledgerName}
                onChange={(e) => handleInputChange('ledgerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter ledger name"
              />
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md flex items-center gap-2"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Founded Records Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Founded Records:</h2>
            <p className="text-sm text-gray-600">Total {totalRecords}-Records Total</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border">Number</th>
                  <th className="px-3 py-2 text-left border">Name</th>
                  <th className="px-3 py-2 text-left border">Father</th>
                  <th className="px-3 py-2 text-right border">Amount</th>
                  <th className="px-3 py-2 text-right border">Inst</th>
                  <th className="px-3 py-2 text-left border">Phone</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-400 border">
                      Loading...
                    </td>
                  </tr>
                ) : foundedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-400 border">
                      No records found. Use the search form above to find loans.
                    </td>
                  </tr>
                ) : (
                  foundedRecords.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border">{loan.loanType}-{loan.number}</td>
                      <td className="px-3 py-2 border">{loan.customerName}</td>
                      <td className="px-3 py-2 border">{loan.fatherName || '-'}</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(loan.loanAmount)}</td>
                      <td className="px-3 py-2 border text-right">
                        {loan.loanType === 'STBD' || loan.loanType === 'HP' 
                          ? formatCurrency(loan.loanAmount / (loan.period || 1))
                          : formatCurrency(0)}
                      </td>
                      <td className="px-3 py-2 border">{loan.phone1 || '-'}</td>
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
                value={foundedRecords.length > 0 ? '1' : '0'}
                readOnly
                className="w-20 px-2 py-1 border border-gray-300 rounded-md bg-gray-50"
              />
              <span className="text-sm">1 of {foundedRecords.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-gray-300 hover:bg-gray-400 px-3 py-1 rounded text-sm">
                No Filter
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
