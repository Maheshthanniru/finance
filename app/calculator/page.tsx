'use client'

import { useState, useEffect } from 'react'
import { LoanType } from '@/types'

export default function CalculatorPage() {
  const [loanType, setLoanType] = useState<LoanType>('CD')
  const [loanAmount, setLoanAmount] = useState(10000)
  const [loanPeriod, setLoanPeriod] = useState(12)
  const [interest, setInterest] = useState(0)
  const [installment, setInstallment] = useState(0)
  const [document, setDocument] = useState(100)
  const [payment, setPayment] = useState(0)

  useEffect(() => {
    calculateValues()
  }, [loanAmount, loanPeriod, loanType, document])

  const calculateValues = () => {
    // Calculate interest based on loan type and period
    let calculatedInterest = 0
    let calculatedInstallment = 0

    if (loanType === 'CD') {
      // CD: Simple interest calculation
      calculatedInterest = (loanAmount * loanPeriod * 12) / 100 // Example: 12% per annum
      calculatedInstallment = calculatedInterest
    } else if (loanType === 'STBD' || loanType === 'HP') {
      // STBD/HP: Installment-based
      calculatedInterest = (loanAmount * loanPeriod * 2) / 100 // Example calculation
      calculatedInstallment = Math.ceil((loanAmount + calculatedInterest) / loanPeriod)
    } else if (loanType === 'TBD') {
      // TBD: Premium-based
      calculatedInterest = (loanAmount * loanPeriod * 1.5) / 100
      calculatedInstallment = Math.ceil(loanAmount / loanPeriod)
    }

    setInterest(Math.round(calculatedInterest))
    setInstallment(Math.round(calculatedInstallment))
    setPayment(loanAmount - document)
  }

  const handleInputChange = (field: string, value: any) => {
    switch (field) {
      case 'loanType':
        setLoanType(value)
        break
      case 'loanAmount':
        setLoanAmount(parseFloat(value) || 0)
        break
      case 'loanPeriod':
        setLoanPeriod(parseInt(value) || 0)
        break
      case 'document':
        setDocument(parseFloat(value) || 0)
        break
      case 'interest':
        setInterest(parseFloat(value) || 0)
        break
      case 'installment':
        setInstallment(parseFloat(value) || 0)
        break
    }
    calculateValues()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="bg-orange-500 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-bold">General Calculation</h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Loan Type:</label>
              <select
                value={loanType}
                onChange={(e) => handleInputChange('loanType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="CD">CD</option>
                <option value="STBD">STBD</option>
                <option value="HP">HP</option>
                <option value="TBD">TBD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Loan Amount:</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Loan Period:</label>
              <input
                type="number"
                value={loanPeriod}
                onChange={(e) => handleInputChange('loanPeriod', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Interest:</label>
              <input
                type="number"
                value={interest}
                onChange={(e) => handleInputChange('interest', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-red-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Installment:</label>
              <input
                type="number"
                value={installment}
                onChange={(e) => handleInputChange('installment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-red-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Document:</label>
              <input
                type="number"
                value={document}
                onChange={(e) => handleInputChange('document', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-red-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Payment:</label>
              <input
                type="number"
                value={payment}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 font-bold"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-3 flex items-center justify-between rounded-b-lg">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm">
                &lt;&lt;
              </button>
              <button className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm">
                &lt;
              </button>
              <span className="text-sm">Record: 1 of 1</span>
              <button className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm">
                &gt;
              </button>
              <button className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm">
                &gt;&gt;
              </button>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm">
                No Filter
              </button>
              <button className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded text-sm">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
