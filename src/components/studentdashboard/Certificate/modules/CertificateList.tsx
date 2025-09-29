"use client"
import React from 'react'
import CertificateCard from './CertificateCard'

interface Certificate {
  id: string
  certificateNumber: string
  recipientName: string
  courseName: string
  date: string
  directorName: string
  awardedBy: string
}

interface CertificateListProps {
  certificates: Certificate[]
  onDownload: (certificateId: string) => void
}

export default function CertificateList({ certificates, onDownload }: CertificateListProps) {
  // Safety check to prevent errors
  if (!certificates || certificates.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No certificates found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {certificates.map((certificate) => (
        <CertificateCard
          key={certificate.id}
          certificateNumber={certificate.certificateNumber}
          recipientName={certificate.recipientName}
          courseName={certificate.courseName}
          date={certificate.date}
          directorName={certificate.directorName}
          awardedBy={certificate.awardedBy}
          onDownload={() => onDownload(certificate.id)}
        />
      ))}
    </div>
  )
}
