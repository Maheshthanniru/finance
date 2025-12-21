'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import { Partner } from '@/types'

interface PartnerExtended extends Partner {
  partnerId?: number
  isMD?: boolean
  mdName?: string
  village?: string
  homePhone?: string
}

export default function PartnersPage() {
  const router = useRouter()
  const [partners, setPartners] = useState<PartnerExtended[]>([])
  const [mdWisePartners, setMdWisePartners] = useState<PartnerExtended[]>([])

  useEffect(() => {
    fetchPartners()
  }, [])

  useEffect(() => {
    const mdPartners = partners.filter(p => p.isMD)
    setMdWisePartners(mdPartners.length > 0 ? mdPartners : partners)
  }, [partners])

  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/partners')
      const data = await response.json()
      setPartners(data)
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-orange-500 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="hover:bg-orange-600 p-2 rounded">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Partners</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* All Partners Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">All Partners</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">PartnerName</th>
                      <th className="px-2 py-2 text-center border">ISMD</th>
                      <th className="px-2 py-2 text-left border">MDName</th>
                      <th className="px-2 py-2 text-left border">Village</th>
                      <th className="px-2 py-2 text-left border">PartnerPhone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400 border">
                          No partners found
                        </td>
                      </tr>
                    ) : (
                      partners.map((partner) => (
                        <tr
                          key={partner.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 border">{partner.partnerId || '-'}</td>
                          <td className="px-2 py-2 border">{partner.name}</td>
                          <td className="px-2 py-2 border text-center">
                            <input
                              type="checkbox"
                              checked={partner.isMD || false}
                              readOnly
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-2 py-2 border">{partner.mdName || '-'}</td>
                          <td className="px-2 py-2 border">{partner.village || '-'}</td>
                          <td className="px-2 py-2 border">{partner.homePhone || partner.phone || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Record: 1 of {partners.length}</span>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>

            {/* MD Wise Partners Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">MD Wise Partners</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left border">ID</th>
                      <th className="px-2 py-2 text-left border">PartnerName</th>
                      <th className="px-2 py-2 text-center border">ISMD</th>
                      <th className="px-2 py-2 text-left border">MDName</th>
                      <th className="px-2 py-2 text-left border">Village</th>
                      <th className="px-2 py-2 text-left border">PartnerP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mdWisePartners.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-400 border">
                          No MD partners found
                        </td>
                      </tr>
                    ) : (
                      mdWisePartners.map((partner) => (
                        <tr
                          key={partner.id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-2 py-2 border">{partner.partnerId || '-'}</td>
                          <td className="px-2 py-2 border">{partner.name}</td>
                          <td className="px-2 py-2 border text-center">
                            <input
                              type="checkbox"
                              checked={partner.isMD || false}
                              readOnly
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-2 py-2 border">{partner.mdName || '-'}</td>
                          <td className="px-2 py-2 border">{partner.village || '-'}</td>
                          <td className="px-2 py-2 border">{partner.homePhone || partner.phone || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Record: 1 of {mdWisePartners.length}</span>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-md flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
