'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCw, X, Search } from 'lucide-react'

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
}

export default function CustomersPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Customer>>({
    customerId: 0,
  })
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomer) {
      const customer = customers.find(c => c.id === selectedCustomer)
      if (customer) {
        setFormData(customer)
      }
    }
  }, [selectedCustomer, customers])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const response = await fetch('/api/customers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        alert('Customer saved successfully!')
        fetchCustomers()
        setFormData({ customerId: customers.length + 1 })
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Error saving customer')
    }
  }

  const handleUpdate = async () => {
    if (!formData.id) {
      alert('Please select a customer to update')
      return
    }
    await handleSave()
  }

  const handleDelete = async () => {
    if (!formData.id) {
      alert('Please select a customer to delete')
      return
    }
    if (!confirm('Are you sure you want to delete this customer?')) return

    try {
      const response = await fetch(`/api/customers?id=${formData.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        alert('Customer deleted successfully!')
        fetchCustomers()
        setFormData({ customerId: customers.length })
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Error deleting customer')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone1?.includes(searchTerm) ||
    customer.phone2?.includes(searchTerm)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Customers</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Customer Entry Form */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-red-600">New Customer Entry Form</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Customer ID:</label>
                  <input
                    type="number"
                    value={formData.customerId || ''}
                    onChange={(e) => handleInputChange('customerId', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Aadhaar:</label>
                  <input
                    type="text"
                    value={formData.aadhaar || ''}
                    onChange={(e) => handleInputChange('aadhaar', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name:</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Father:</label>
                  <input
                    type="text"
                    value={formData.father || ''}
                    onChange={(e) => handleInputChange('father', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address:</label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Village:</label>
                  <input
                    type="text"
                    value={formData.village || ''}
                    onChange={(e) => handleInputChange('village', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mandal:</label>
                  <input
                    type="text"
                    value={formData.mandal || ''}
                    onChange={(e) => handleInputChange('mandal', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">District:</label>
                  <input
                    type="text"
                    value={formData.district || ''}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone-1:</label>
                    <input
                      type="tel"
                      value={formData.phone1 || ''}
                      onChange={(e) => handleInputChange('phone1', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone-2:</label>
                    <input
                      type="tel"
                      value={formData.phone2 || ''}
                      onChange={(e) => handleInputChange('phone2', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Update
                  </button>
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setFormData({ customerId: customers.length + 1 })
                      setSelectedCustomer('')
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                  >
                    Close Form
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Customers Table */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">No.</th>
                      <th className="px-2 py-2 text-left border">Name</th>
                      <th className="px-2 py-2 text-left border">Address</th>
                      <th className="px-2 py-2 text-left border">Father</th>
                      <th className="px-2 py-2 text-left border">Village</th>
                      <th className="px-2 py-2 text-left border">Mandal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-gray-400 border">
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className={`hover:bg-gray-50 cursor-pointer ${
                            selectedCustomer === customer.id ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => setSelectedCustomer(customer.id)}
                        >
                          <td className="px-2 py-2 border">{customer.customerId}</td>
                          <td className="px-2 py-2 border">{customer.customerId - 1}</td>
                          <td className="px-2 py-2 border">{customer.name}</td>
                          <td className="px-2 py-2 border">{customer.address}</td>
                          <td className="px-2 py-2 border">{customer.father || '-'}</td>
                          <td className="px-2 py-2 border">{customer.village || '-'}</td>
                          <td className="px-2 py-2 border">{customer.mandal || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                Record: {filteredCustomers.length > 0 ? '1' : '0'} of {filteredCustomers.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

