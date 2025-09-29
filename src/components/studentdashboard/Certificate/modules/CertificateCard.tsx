"use client"
import React from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import Image from 'next/image'

interface CertificateCardProps {
  certificateNumber: string
  recipientName: string
  courseName: string
  date: string
  directorName: string
  awardedBy: string
  onDownload: () => void
}

export default function CertificateCard({
  certificateNumber,

  onDownload
}: CertificateCardProps) {
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Certificate Image */}
      <div className="relative">
        <Image 
          src="/student/cetificate.png" 
          alt="Certificate" 
          className="w-full h-auto object-contain"
          width={600}
          height={400}
        />
      </div>

      {/* Footer with certificate info and download button */}
      <div className="p-6">
        <div className="text-center text-sm text-gray-500 mb-4">
          certificate of completion #{certificateNumber}
        </div>
        <div className="flex justify-center">
          <Button 
            onClick={onDownload}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-8 rounded-lg transition-colors w-full max-w-md flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
