'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'

interface Customer {
  id: string
  customerId: number
  aadhaar?: string
  name: string
  father?: string
  address: string
  village?: string
  mandal?: string
  district?: string
  phone1?: string
  phone2?: string
  imageUrl?: string
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) {
        throw new Error('Failed to fetch customers')
      }
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
      alert('Error fetching customers. Please check the console for details.')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone1?.includes(searchTerm) ||
    customer.phone2?.includes(searchTerm) ||
    customer.aadhaar?.includes(searchTerm) ||
    customer.village?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mandal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.district?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-orange-600 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Customers</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 flex items-center gap-2">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button 
              onClick={fetchCustomers}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-2 text-left border">ID</th>
                  <th className="px-2 py-2 text-left border">Name</th>
                  <th className="px-2 py-2 text-left border">Father</th>
                  <th className="px-2 py-2 text-left border">Address</th>
                  <th className="px-2 py-2 text-left border">Village</th>
                  <th className="px-2 py-2 text-left border">Mandal</th>
                  <th className="px-2 py-2 text-left border">District</th>
                  <th className="px-2 py-2 text-left border">Phone1</th>
                  <th className="px-2 py-2 text-left border">Phone2</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-2 py-4 text-center text-gray-400 border">
                      {customers.length === 0 
                        ? 'No customers found. Add a new customer from the "New Customer Entry" page.'
                        : 'No customers match your search criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedCustomer === customer.id ? 'bg-orange-50' : ''
                      }`}
                      onClick={() => setSelectedCustomer(customer.id)}
                    >
                      <td className="px-2 py-2 border">{customer.customerId}</td>
                      <td className="px-2 py-2 border">{customer.name}</td>
                      <td className="px-2 py-2 border">{customer.father || '-'}</td>
                      <td className="px-2 py-2 border">{customer.address}</td>
                      <td className="px-2 py-2 border">{customer.village || '-'}</td>
                      <td className="px-2 py-2 border">{customer.mandal || '-'}</td>
                      <td className="px-2 py-2 border">{customer.district || '-'}</td>
                      <td className="px-2 py-2 border">{customer.phone1 || '-'}</td>
                      <td className="px-2 py-2 border">{customer.phone2 || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Record: {filteredCustomers.length > 0 ? '1' : '0'} of {filteredCustomers.length} (Total: {customers.length})
          </div>
        </div>
      </div>
    </div>
  )
}
