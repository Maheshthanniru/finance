'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

interface AccountType {
  accountType: string
  credit: number
  debit: number
  balance: number
}

interface Account {
  aName: string
  credit: number
  debit: number
  balance: number
}

interface TransactionDetail {
  date: string
  particulars: string
  number?: string
  credit: number
  debit: number
  balance: number
}

export default function GeneralLedgerPage() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState('2013-04-25')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountType, setSelectedAccountType] = useState<string>('')
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [details, setDetails] = useState<TransactionDetail[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAccountTypes()
  }, [fromDate, toDate])

  useEffect(() => {
    if (selectedAccountType) {
      fetchAccounts(selectedAccountType)
    }
  }, [selectedAccountType])

  useEffect(() => {
    if (selectedAccount) {
      fetchDetails(selectedAccount)
    }
  }, [selectedAccount])

  const fetchAccountTypes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/ledger/account-types?fromDate=${fromDate}&toDate=${toDate}`)
      const data = await response.json()
      setAccountTypes(data)
    } catch (error) {
      console.error('Error fetching account types:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async (accountType: string) => {
    try {
      const response = await fetch(`/api/reports/ledger/accounts?accountType=${accountType}&fromDate=${fromDate}&toDate=${toDate}`)
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchDetails = async (accountName: string) => {
    try {
      const response = await fetch(`/api/reports/ledger/details?accountName=${accountName}&fromDate=${fromDate}&toDate=${toDate}`)
      const data = await response.json()
      setDetails(data)
    } catch (error) {
      console.error('Error fetching details:', error)
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
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">General Ledger</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Date Range Selection */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Date:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={fetchAccountTypes}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 mt-6"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Account Types Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Account Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left border">Account_Type</th>
                      <th className="px-3 py-2 text-right border">Credit</th>
                      <th className="px-3 py-2 text-right border">Debit</th>
                      <th className="px-3 py-2 text-right border">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-400 border">
                          Loading...
                        </td>
                      </tr>
                    ) : accountTypes.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-400 border">
                          No account types found
                        </td>
                      </tr>
                    ) : (
                      accountTypes.map((type, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedAccountType === type.accountType ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedAccountType(type.accountType)}
                        >
                          <td className="px-3 py-2 border">{type.accountType}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(type.credit)}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(type.debit)}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(type.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Name of the Accounts */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">Name of the Accounts:</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left border">aName</th>
                      <th className="px-3 py-2 text-right border">Credit</th>
                      <th className="px-3 py-2 text-right border">Debit</th>
                      <th className="px-3 py-2 text-right border">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-400 border">
                          {selectedAccountType ? 'No accounts found' : 'Select an account type'}
                        </td>
                      </tr>
                    ) : (
                      accounts.map((account, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedAccount === account.aName ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedAccount(account.aName)}
                        >
                          <td className="px-3 py-2 border">{account.aName}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(account.credit)}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(account.debit)}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(account.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Details:</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left border">D Date</th>
                      <th className="px-3 py-2 text-left border">Particulars</th>
                      <th className="px-3 py-2 text-left border">No</th>
                      <th className="px-3 py-2 text-right border">Credit</th>
                      <th className="px-3 py-2 text-right border">Debit</th>
                      <th className="px-3 py-2 text-right border">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-center text-gray-400 border">
                          {selectedAccount ? 'No details found' : 'Select an account'}
                        </td>
                      </tr>
                    ) : (
                      details.map((detail, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 border">{formatDate(detail.date)}</td>
                          <td className="px-3 py-2 border">{detail.particulars}</td>
                          <td className="px-3 py-2 border">{detail.number || '-'}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(detail.credit)}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(detail.debit)}</td>
                          <td className="px-3 py-2 border text-right">{formatCurrency(detail.balance)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel - Print Options */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-bold mb-4">Print Options</h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Total Statement Print
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" />
                  Selected Account Type Print
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" />
                  All Account Types Print ALL
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" />
                  Selected Account Print
                </button>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center justify-center gap-2">
                  <Printer className="w-5 h-5" />
                  All Accounts Printall
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
