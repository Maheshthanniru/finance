'use client'

import { useState, useEffect } from 'react'
import { X, Calculator, RefreshCw } from 'lucide-react'

interface RenewalModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number, isPartial: boolean) => Promise<void>
  mode: 'full' | 'partial'
  totalRenewalAmount: number
  customerName?: string
  loanNumber?: string | number
  currentLoanAmount?: number
  isLoading?: boolean
}

export default function RenewalModal({
  isOpen,
  onClose,
  onConfirm,
  mode,
  totalRenewalAmount,
  customerName,
  loanNumber,
  currentLoanAmount = 0,
  isLoading = false,
}: RenewalModalProps) {
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [remainingBalance, setRemainingBalance] = useState<number>(0)
  const [newLoanAmount, setNewLoanAmount] = useState<number>(0)
  const [error, setError] = useState<string>('')

  // Initialize payment amount based on mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'full') {
        setPaymentAmount(totalRenewalAmount.toFixed(2))
      } else {
        setPaymentAmount('')
      }
      setError('')
      setRemainingBalance(0)
      setNewLoanAmount(0)
    }
  }, [isOpen, mode, totalRenewalAmount])

  // Calculate remaining balance and new loan amount in real-time
  useEffect(() => {
    if (mode === 'partial' && paymentAmount) {
      const amount = parseFloat(paymentAmount) || 0
      
      if (amount > totalRenewalAmount) {
        setError(`Payment amount cannot exceed renewal amount of ₹${formatCurrency(totalRenewalAmount)}`)
        setRemainingBalance(0)
        setNewLoanAmount(0)
        return
      }
      
      if (amount <= 0) {
        setError('Payment amount must be greater than 0')
        setRemainingBalance(0)
        return
      }
      
      setError('')
      const remaining = totalRenewalAmount - amount
      setRemainingBalance(remaining)
      // Calculate new loan amount: current loan amount + remaining balance
      setNewLoanAmount(currentLoanAmount + remaining)
    } else if (mode === 'full') {
      const amount = parseFloat(paymentAmount) || 0
      if (amount > totalRenewalAmount) {
        setError(`Payment amount cannot exceed renewal amount of ₹${formatCurrency(totalRenewalAmount)}`)
      } else if (amount <= 0) {
        setError('Payment amount must be greater than 0')
      } else {
        setError('')
      }
      setRemainingBalance(0)
      setNewLoanAmount(0)
    }
  }, [paymentAmount, mode, totalRenewalAmount, currentLoanAmount])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handlePaymentAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '')
    // Prevent multiple decimal points
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      return
    }
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return
    }
    setPaymentAmount(sanitized)
  }

  const handleConfirm = async () => {
    const amount = parseFloat(paymentAmount)
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payment amount')
      return
    }

    if (amount > totalRenewalAmount) {
      setError(`Payment amount cannot exceed renewal amount of ₹${formatCurrency(totalRenewalAmount)}`)
      return
    }

    setError('')
    await onConfirm(amount, mode === 'partial')
  }

  const handleSetMax = () => {
    setPaymentAmount(totalRenewalAmount.toFixed(2))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6" />
            <h2 className="text-xl font-bold">
              {mode === 'full' ? 'Full Renewal' : 'Partial Payment & Renewal'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="hover:bg-orange-700 p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Customer:</span>
                <p className="text-gray-900 font-semibold mt-1">{customerName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Loan Number:</span>
                <p className="text-gray-900 font-semibold mt-1">CD-{loanNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Total Renewal Amount */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-semibold">Total Renewal Amount:</span>
              <span className="text-2xl font-bold text-orange-600">
                ₹{formatCurrency(totalRenewalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {mode === 'full' ? 'Renewal Amount *' : 'Partial Payment Amount *'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                ₹
              </span>
              <input
                type="text"
                value={paymentAmount}
                onChange={(e) => handlePaymentAmountChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="0.00"
                disabled={isLoading}
                className={`w-full pl-10 pr-24 py-3 border-2 rounded-lg text-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                  error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                } disabled:bg-gray-100 disabled:cursor-not-allowed`}
              />
              <button
                onClick={handleSetMax}
                disabled={isLoading}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                MAX
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <X className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          {/* Real-time Calculations (for partial mode) */}
          {mode === 'partial' && paymentAmount && parseFloat(paymentAmount) > 0 && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3 animate-fade-in">
              <h3 className="font-semibold text-blue-900 mb-2">Calculation Summary:</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white rounded p-3 border border-blue-200">
                  <span className="text-blue-600 font-medium block mb-1">Payment Amount:</span>
                  <span className="text-lg font-bold text-blue-900">
                    ₹{formatCurrency(parseFloat(paymentAmount) || 0)}
                  </span>
                </div>
                <div className="bg-white rounded p-3 border border-blue-200">
                  <span className="text-blue-600 font-medium block mb-1">Remaining Balance:</span>
                  <span className="text-lg font-bold text-blue-900">
                    ₹{formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 rounded p-3 border border-blue-300">
                <span className="text-blue-700 font-medium block mb-2">Remaining will be added to new loan principal</span>
                <div className="flex items-center justify-between pt-2 border-t border-blue-300">
                  <span className="text-blue-600 font-medium">New Loan Amount:</span>
                  <span className="text-xl font-bold text-blue-900">
                    ₹{formatCurrency(newLoanAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-semibold">Note:</span> This will record a payment transaction and update the loan dates. 
              {mode === 'partial' && ' The remaining balance will be added to the new loan principal.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !paymentAmount || parseFloat(paymentAmount) <= 0 || !!error || parseFloat(paymentAmount) > totalRenewalAmount}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4" />
                {mode === 'full' ? 'Confirm Renewal' : 'Confirm Partial Renewal'}
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
