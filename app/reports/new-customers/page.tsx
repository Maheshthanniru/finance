'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, RefreshCw, Search } from 'lucide-react'
import { format } from 'date-fns'

interface NewCustomer {
  id: string
  customerName: string
  fatherName?: string
  aadhaar?: string
  address: string
  phone1?: string
  phone2?: string
  firstLoanDate: string
  firstLoanNumber: string
  firstLoanAmount: number
  totalLoans: number
  totalLoanAmount: number
}

export default function NewCustomersPage() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState('2013-04-25')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [customers, setCustomers] = useState<NewCustomer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<NewCustomer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<string>('')
  const [partners, setPartners] = useState<string[]>([])

  useEffect(() => {
    fetchPartners()
    fetchNewCustomers()
  }, [])

  useEffect(() => {
    fetchNewCustomers()
  }, [fromDate, toDate, selectedPartner])

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = customers.filter(customer =>
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.aadhaar?.includes(searchTerm) ||
        customer.phone1?.includes(searchTerm) ||
        customer.phone2?.includes(searchTerm) ||
        customer.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchTerm, customers])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      setPartners(data.map((p: any) => p.name))
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const fetchNewCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('fromDate', fromDate)
      params.append('toDate', toDate)
      if (selectedPartner) params.append('partner', selectedPartner)

      const response = await fetch(`/api/reports/new-customers?${params.toString()}`)
      const data = await response.json()
      setCustomers(data.customers || [])
      setFilteredCustomers(data.customers || [])
    } catch (error) {
      console.error('Error fetching new customers:', error)
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

  const totalLoanAmount = filteredCustomers.reduce((sum, c) => sum + c.totalLoanAmount, 0)
  const totalCustomers = filteredCustomers.length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="hover:bg-orange-600 p-2 rounded">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">New Customers Report</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchNewCustomers}
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
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-sm font-medium mb-1">Partner:</label>
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Partners</option>
                {partners.map((partner) => (
                  <option key={partner} value={partner}>
                    {partner}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Search:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Search by name, phone, aadhaar..."
                />
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-orange-50 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total New Customers</div>
              <div className="text-2xl font-bold text-orange-600">{totalCustomers}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Loan Amount</div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalLoanAmount)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Average Loan Amount</div>
              <div className="text-2xl font-bold text-orange-600">
                {totalCustomers > 0 ? formatCurrency(totalLoanAmount / totalCustomers) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-4">New Customers List</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left border">S#</th>
                  <th className="px-3 py-2 text-left border">Date</th>
                  <th className="px-3 py-2 text-left border">Customer Name</th>
                  <th className="px-3 py-2 text-left border">Father Name</th>
                  <th className="px-3 py-2 text-left border">Aadhaar</th>
                  <th className="px-3 py-2 text-left border">Address</th>
                  <th className="px-3 py-2 text-left border">Phone 1</th>
                  <th className="px-3 py-2 text-left border">Phone 2</th>
                  <th className="px-3 py-2 text-left border">First Loan</th>
                  <th className="px-3 py-2 text-right border">First Loan Amount</th>
                  <th className="px-3 py-2 text-right border">Total Loans</th>
                  <th className="px-3 py-2 text-right border">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={12} className="px-3 py-4 text-center text-gray-400 border">
                      Loading...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-3 py-4 text-center text-gray-400 border">
                      No new customers found for the selected date range
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, idx) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border">{idx + 1}</td>
                      <td className="px-3 py-2 border">{formatDate(customer.firstLoanDate)}</td>
                      <td className="px-3 py-2 border font-medium">{customer.customerName}</td>
                      <td className="px-3 py-2 border">{customer.fatherName || '-'}</td>
                      <td className="px-3 py-2 border">{customer.aadhaar || '-'}</td>
                      <td className="px-3 py-2 border max-w-xs truncate">{customer.address || '-'}</td>
                      <td className="px-3 py-2 border">{customer.phone1 || '-'}</td>
                      <td className="px-3 py-2 border">{customer.phone2 || '-'}</td>
                      <td className="px-3 py-2 border">{customer.firstLoanNumber}</td>
                      <td className="px-3 py-2 border text-right">{formatCurrency(customer.firstLoanAmount)}</td>
                      <td className="px-3 py-2 border text-right">{customer.totalLoans}</td>
                      <td className="px-3 py-2 border text-right font-semibold">
                        {formatCurrency(customer.totalLoanAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={9} className="px-3 py-2 border text-right">Total:</td>
                  <td className="px-3 py-2 border text-right">
                    {formatCurrency(filteredCustomers.reduce((sum, c) => sum + c.firstLoanAmount, 0))}
                  </td>
                  <td className="px-3 py-2 border text-right">
                    {filteredCustomers.reduce((sum, c) => sum + c.totalLoans, 0)}
                  </td>
                  <td className="px-3 py-2 border text-right">
                    {formatCurrency(totalLoanAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredCustomers.length} of {customers.length} customers
            </div>
            <div className="text-sm text-gray-600">
              Record: 1 of {filteredCustomers.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


