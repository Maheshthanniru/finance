'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'

interface EditedMember {
  id: string
  oDate: string
  nDate: string
  oNumber: string
  nNumber: string
  oName: string
  nName: string
  oAdhaar?: string
  nAdhaar?: string
  oAmount: number
  nAmount: number
  user: string
}

interface DeletedMember {
  id: string
  date: string
  number: string
  name: string
  aadhaar?: string
  amount: number
  user: string
}

interface DeletedDaybook {
  id: string
  ddate: string
  nameoftheAccount: string
  particulars: string
  accountnumb?: string
}

export default function EditedDeletedPage() {
  const router = useRouter()
  const [fromDate, setFromDate] = useState('2013-04-25')
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [month, setMonth] = useState('2022-01')
  const [editedMembers, setEditedMembers] = useState<EditedMember[]>([])
  const [deletedMembers, setDeletedMembers] = useState<DeletedMember[]>([])
  const [deletedDaybook, setDeletedDaybook] = useState<DeletedDaybook[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [fromDate, toDate, month])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('fromDate', fromDate)
      params.append('toDate', toDate)
      params.append('month', month)

      const [editedRes, deletedRes, daybookRes] = await Promise.all([
        fetch(`/api/reports/edited?${params.toString()}`),
        fetch(`/api/reports/deleted?${params.toString()}`),
        fetch(`/api/reports/deleted-daybook?${params.toString()}`),
      ])

      const editedData = await editedRes.json()
      const deletedData = await deletedRes.json()
      const daybookData = await daybookRes.json()

      setEditedMembers(editedData)
      setDeletedMembers(deletedData)
      setDeletedDaybook(daybookData)
    } catch (error) {
      console.error('Error fetching data:', error)
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
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">ED Form</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Date Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month:</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Dt:</label>
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
              onClick={() => {
                setFromDate('2013-04-25')
                setToDate(new Date().toISOString().split('T')[0])
                setMonth('2022-01')
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center gap-2 mt-6"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Dates
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Edited Members Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Edited Members</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">ODate</th>
                      <th className="px-2 py-2 text-left border">NDate</th>
                      <th className="px-2 py-2 text-left border">ONumber</th>
                      <th className="px-2 py-2 text-left border">NNumber</th>
                      <th className="px-2 py-2 text-left border">OName</th>
                      <th className="px-2 py-2 text-left border">NName</th>
                      <th className="px-2 py-2 text-left border">OAdhaar</th>
                      <th className="px-2 py-2 text-left border">NAdhaar</th>
                      <th className="px-2 py-2 text-right border">OAmount</th>
                      <th className="px-2 py-2 text-right border">NAmount</th>
                      <th className="px-2 py-2 text-left border">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={12} className="px-2 py-4 text-center text-gray-400 border">
                          Loading...
                        </td>
                      </tr>
                    ) : editedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-2 py-4 text-center text-gray-400 border">
                          No edited records found
                        </td>
                      </tr>
                    ) : (
                      editedMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{member.id}</td>
                          <td className="px-2 py-2 border">{formatDate(member.oDate)}</td>
                          <td className="px-2 py-2 border">{formatDate(member.nDate)}</td>
                          <td className="px-2 py-2 border">{member.oNumber}</td>
                          <td className="px-2 py-2 border">{member.nNumber}</td>
                          <td className="px-2 py-2 border">{member.oName}</td>
                          <td className="px-2 py-2 border">{member.nName}</td>
                          <td className="px-2 py-2 border">{member.oAdhaar || '-'}</td>
                          <td className="px-2 py-2 border">{member.nAdhaar || '-'}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(member.oAmount)}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(member.nAmount)}</td>
                          <td className="px-2 py-2 border">{member.user}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Record: 1 of {editedMembers.length}</span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            {/* Deleted Members Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Deleted Members</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">Date</th>
                      <th className="px-2 py-2 text-left border">Number</th>
                      <th className="px-2 py-2 text-left border">Name</th>
                      <th className="px-2 py-2 text-left border">Adhaar</th>
                      <th className="px-2 py-2 text-right border">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400 border">
                          Loading...
                        </td>
                      </tr>
                    ) : deletedMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400 border">
                          No deleted records found
                        </td>
                      </tr>
                    ) : (
                      deletedMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{member.id}</td>
                          <td className="px-2 py-2 border">{formatDate(member.date)}</td>
                          <td className="px-2 py-2 border">{member.number}</td>
                          <td className="px-2 py-2 border">{member.name}</td>
                          <td className="px-2 py-2 border">{member.aadhaar || '-'}</td>
                          <td className="px-2 py-2 border text-right">{formatCurrency(member.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Record: 1 of {deletedMembers.length}</span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Deleted Daybook */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">Deleted Daybook</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">Ddate</th>
                      <th className="px-2 py-2 text-left border">NameoftheAccount</th>
                      <th className="px-2 py-2 text-left border">Particulars</th>
                      <th className="px-2 py-2 text-left border">Accountnumb</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-gray-400 border">
                          Loading...
                        </td>
                      </tr>
                    ) : deletedDaybook.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-2 py-4 text-center text-gray-400 border">
                          No deleted daybook records found
                        </td>
                      </tr>
                    ) : (
                      deletedDaybook.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-2 py-2 border">{entry.id}</td>
                          <td className="px-2 py-2 border">{formatDate(entry.ddate)}</td>
                          <td className="px-2 py-2 border">{entry.nameoftheAccount}</td>
                          <td className="px-2 py-2 border">{entry.particulars}</td>
                          <td className="px-2 py-2 border">{entry.accountnumb || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Record: 1 of {deletedDaybook.length}</span>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md flex items-center gap-2">
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

