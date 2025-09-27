"use client"
import React from 'react'
import { DashboardHeader } from '../navbar/Header'
import CertificateList from './modules/CertificateList'

export default function Certificatepage() {
  // Sample certificate data - replace with actual data from your API
  const certificates = [
    {
      id: '1',
      certificateNumber: '1902',
      recipientName: 'Mr. Susan Johns',
      courseName: 'Advanced Web Development',
      date: 'AUGUST-25-2022',
      directorName: 'Mr. Susan Amy',
      awardedBy: 'Mr. Ainika Forg'
    },
    {
      id: '2',
      certificateNumber: '1903',
      recipientName: 'Ms. Jane Smith',
      courseName: 'Data Science Fundamentals',
      date: 'SEPTEMBER-15-2022',
      directorName: 'Dr. John Doe',
      awardedBy: 'Prof. Sarah Wilson'
    }
  ]

  const handleDownload = (certificateId: string) => {
    // Implement download functionality
    console.log('Downloading certificate:', certificateId)
  }

  return (
    <div className="min-h-screen bg-white ">      
      <div className="container mx-[auto] px-2 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-black mb-2">Certificate</h1>
          <p className="text-gray-600">View and download your certificates</p>
        </div>

        <CertificateList 
          certificates={certificates}
          onDownload={handleDownload}
        />
      </div>
    </div>
  )
}
