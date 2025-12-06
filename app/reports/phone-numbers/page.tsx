'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import PhoneNumberEditModal from '@/components/PhoneNumberEditModal'

export default function PhoneNumbersEditPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="hover:bg-blue-700 p-2 rounded">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">Phone Numbers Edit Form</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 py-6">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-lg font-semibold"
            >
              Open Phone Number Edit Form
            </button>
          </div>
        </div>
      </div>

      <PhoneNumberEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

