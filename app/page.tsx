'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  Edit, 
  Users, 
  Search, 
  Calculator, 
  DollarSign,
  BookOpen,
  BarChart3,
  TrendingUp,
  UserPlus,
  CreditCard,
  Receipt,
  Calendar
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: '2-digit' 
  }).replace(/ /g, '-'))

  const newEntries = [
    { name: 'Loans Entry Form', icon: FileText, path: '/loans/new' },
    { name: 'Edit', icon: Edit, path: '/loans/edit' },
    { name: 'Partners', icon: Users, path: '/partners' },
    { name: 'Search', icon: Search, path: '/search' },
    { name: 'General Calculation', icon: Calculator, path: '/calculator' },
    { name: 'Capital Entry form', icon: DollarSign, path: '/capital' },
  ]

  const reports = [
    { name: 'Day Book', icon: BookOpen, path: '/reports/daybook' },
    { name: 'General Ledger', icon: FileText, path: '/reports/ledger' },
    { name: 'Phone Numbers Edit Form', icon: FileText, path: '/reports/phone-numbers' },
    { name: 'Daily Report', icon: Calendar, path: '/reports/daily' },
    { name: 'Profit and Loss', icon: TrendingUp, path: '/reports/profit-loss' },
    { name: 'Final Statement', icon: BarChart3, path: '/reports/statement' },
    { name: 'Business Details', icon: BarChart3, path: '/reports/business' },
    { name: 'Partner Performance', icon: Users, path: '/reports/partner-performance' },
    { name: 'New Customers', icon: UserPlus, path: '/reports/new-customers' },
    { name: 'CD Ledger', icon: CreditCard, path: '/reports/cd-ledger' },
    { name: 'STBD Ledger', icon: Receipt, path: '/reports/stbd-ledger' },
    { name: 'HP Ledger', icon: Receipt, path: '/reports/hp-ledger' },
    { name: 'TBD Ledger', icon: Receipt, path: '/reports/tbd-ledger' },
    { name: 'Dues List', icon: FileText, path: '/reports/dues' },
    { name: 'Edited Deleted Records', icon: FileText, path: '/reports/edited-deleted' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">TIRUMALA FINANCE</h1>
            <div className="text-right">
              <div className="text-sm opacity-90">Admin</div>
              <div className="text-lg font-semibold">Date: {currentDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* New Entries Section */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">New Entries</h2>
            <div className="space-y-3">
              {newEntries.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-3 border border-gray-200"
                  >
                    <Icon className="w-5 h-5 text-orange-500" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reports Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reports.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.path)}
                    className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-3 border border-gray-200"
                  >
                    <Icon className="w-5 h-5 text-orange-500" />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-orange-500 text-white mt-8">
        <div className="container mx-auto px-6 py-4 text-center">
          <p className="text-sm">Gaimel, Dist: Siddipet, Telangana</p>
        </div>
      </div>
    </div>
  )
}

