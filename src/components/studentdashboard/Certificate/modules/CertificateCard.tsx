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
    <div className="bg-white rounded-xl overflow-hidden">
      {/* Certificate Image */}
      <div className="relative">
        <Image 
          src="/student/cetificate.png" 
          alt="Certificate" 
          width={1200}
          height={800}
          className="w-full h-auto object-contain"
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
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-medium py-3 px-8 rounded-xl transition-colors w-full max-w-md flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
