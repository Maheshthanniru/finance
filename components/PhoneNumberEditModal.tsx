'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface PhoneNumberEditModalProps {
  isOpen: boolean
  onClose: () => void
  accountNumber?: string
}

export default function PhoneNumberEditModal({
  isOpen,
  onClose,
  accountNumber: initialAccountNumber,
}: PhoneNumberEditModalProps) {
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber || '')
  const [accounts, setAccounts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    father: '',
    address: '',
    phone: '',
    guarantor: '',
    guarantorPhone: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchAccounts()
      if (accountNumber) {
        fetchAccountDetails(accountNumber)
      }
    }
  }, [accountNumber, isOpen])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/loans')
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchAccountDetails = async (accNo: string) => {
    try {
      // Try to find by account number format (e.g., "CD-123")
      const [loanType, number] = accNo.split('-')
      const response = await fetch(`/api/loans?type=${loanType}&number=${number}`)
      const data = await response.json()
      if (data.length > 0) {
        const loan = data[0]
        setFormData({
          number: `${loan.loanType}-${loan.number}`,
          name: loan.customerName || '',
          father: loan.fatherName || '',
          address: loan.address || '',
          phone: loan.phone1 || '',
          guarantor: loan.guarantor1?.name || '',
          guarantorPhone: loan.guarantor1?.phone || '',
        })
      } else {
        // Try direct ID lookup
        const loanResponse = await fetch(`/api/loans/${accNo}`)
        if (loanResponse.ok) {
          const loan = await loanResponse.json()
          setFormData({
            number: `${loan.loanType}-${loan.number}`,
            name: loan.customerName || '',
            father: loan.fatherName || '',
            address: loan.address || '',
            phone: loan.phone1 || '',
            guarantor: loan.guarantor1?.name || '',
            guarantorPhone: loan.guarantor1?.phone || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching account details:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/customers/phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          ...formData,
        }),
      })
      if (response.ok) {
        alert('Phone number updated successfully!')
        onClose()
      }
    } catch (error) {
      console.error('Error updating phone number:', error)
      alert('Error updating phone number')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg font-bold">phone number edit form</h2>
          <button
            onClick={onClose}
            className="hover:bg-gray-700 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Account Number:</label>
            <select
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value)
                if (e.target.value) {
                  fetchAccountDetails(e.target.value)
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Account</option>
              {accounts.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.loanType}-{loan.number} - {loan.customerName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Number:</label>
              <input
                type="text"
                value={formData.number}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name:</label>
              <input
                type="text"
                value={formData.name}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Father:</label>
              <input
                type="text"
                value={formData.father}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address:</label>
              <input
                type="text"
                value={formData.address}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone:</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Guarantor:</label>
              <input
                type="text"
                value={formData.guarantor}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone:</label>
              <input
                type="tel"
                value={formData.guarantorPhone}
                onChange={(e) => handleInputChange('guarantorPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-3 flex justify-end gap-2 rounded-b-lg">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

