'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, RotateCcw } from 'lucide-react'
import { Loan } from '@/types'
import { format } from 'date-fns'

export default function AadhaarSearchPage() {
  const router = useRouter()
  const [aadhaar, setAadhaar] = useState('')
  const [name, setName] = useState('')
  const [foundedRecords, setFoundedRecords] = useState<Loan[]>([])
  const [loading, setLoading] = useState(false)
  const [totalRecords, setTotalRecords] = useState(0)

  const handleSearch = async () => {
    if (!aadhaar.trim() && !name.trim()) {
      alert('Please enter Aadhaar number or Name to search')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (aadhaar.trim()) params.append('aadhaar', aadhaar.trim())
      if (name.trim()) params.append('name', name.trim())
      
      const response = await fetch(`/api/search/loans?${params.toString()}`)
      const data = await response.json()
      
      // Get all loans (as customer, guarantor1, or guarantor2)
      const allResults = [
        ...(data.allLoans || []),
        ...(data.runningLoans || []),
        ...(data.asGuarantor1 || []),
        ...(data.asGuarantor2 || [])
      ]
      
      // Remove duplicates based on loan id
      const uniqueLoans = Array.from(
        new Map(allResults.map(loan => [loan.id, loan])).values()
      )
      
      setFoundedRecords(uniqueLoans)
      setTotalRecords(uniqueLoans.length)
    } catch (error) {
      console.error('Error searching loans:', error)
      alert('Error searching loans')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setAadhaar('')
    setName('')
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
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="hover:bg-orange-600 p-2 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Aadhaar Search</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Search by Aadhaar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Aadhaar Number: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '') // Only numbers
                  setAadhaar(value.slice(0, 12)) // Max 12 digits
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter 12-digit Aadhaar number"
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-1">
                {aadhaar.length}/12 digits
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Name (Optional):
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter name for additional filter"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSearch}
              disabled={loading || (!aadhaar.trim() && !name.trim())}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Search Results:</h2>
            <p className="text-sm text-gray-600">
              Total {totalRecords} Record{totalRecords !== 1 ? 's' : ''} Found
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border">Loan Number</th>
                  <th className="px-3 py-2 text-left border">Name</th>
                  <th className="px-3 py-2 text-left border">Father</th>
                  <th className="px-3 py-2 text-left border">Aadhaar</th>
                  <th className="px-3 py-2 text-right border">Amount</th>
                  <th className="px-3 py-2 text-right border">Installment</th>
                  <th className="px-3 py-2 text-left border">Phone</th>
                  <th className="px-3 py-2 text-left border">Date</th>
                  <th className="px-3 py-2 text-left border">Role</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-center text-gray-400 border">
                      Searching...
                    </td>
                  </tr>
                ) : foundedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-4 text-center text-gray-400 border">
                      {aadhaar || name 
                        ? 'No records found. Try different search criteria.'
                        : 'Enter Aadhaar number or Name above to search.'}
                    </td>
                  </tr>
                ) : (
                  foundedRecords.map((loan) => {
                    // Determine role (customer, guarantor1, or guarantor2)
                    let role = 'Customer'
                    if (aadhaar && loan.guarantor1?.aadhaar === aadhaar) {
                      role = 'Guarantor 1'
                    } else if (aadhaar && loan.guarantor2?.aadhaar === aadhaar) {
                      role = 'Guarantor 2'
                    } else if (aadhaar && loan.aadhaar === aadhaar) {
                      role = 'Customer'
                    }

                    return (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 border font-medium">
                          {loan.loanType}-{loan.number}
                        </td>
                        <td className="px-3 py-2 border">{loan.customerName}</td>
                        <td className="px-3 py-2 border">{loan.fatherName || '-'}</td>
                        <td className="px-3 py-2 border">{loan.aadhaar || '-'}</td>
                        <td className="px-3 py-2 border text-right">
                          {formatCurrency(loan.loanAmount)}
                        </td>
                        <td className="px-3 py-2 border text-right">
                          {loan.loanType === 'STBD' || loan.loanType === 'HP' 
                            ? formatCurrency(loan.loanAmount / (loan.period || 1))
                            : formatCurrency(0)}
                        </td>
                        <td className="px-3 py-2 border">{loan.phone1 || '-'}</td>
                        <td className="px-3 py-2 border">{formatDate(loan.date)}</td>
                        <td className="px-3 py-2 border">
                          <span className={`px-2 py-1 rounded text-xs ${
                            role === 'Customer' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {role}
                          </span>
                        </td>
                      </tr>
                    )
                  })
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
              <button 
                onClick={handleSearch}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-md flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

