"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useCourse } from '../context/CourseContext'
import { Download, RotateCw, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Certificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  courseName: string;
  studentName: string;
  completionData: {
    preSurveyCompleted: boolean;
    postSurveyCompleted: boolean;
    ideasCompleted: boolean;
    learningModulesCompleted: boolean;
    totalModules: number;
    completedModules: number;
  };
}

interface CompletionStatus {
  preSurveyCompleted: boolean;
  postSurveyCompleted: boolean;
  ideasCompleted: boolean;
  learningModulesCompleted: boolean;
  totalModules: number;
  completedModules: number;
  completionPercentage: number;
}

export default function Certificatepage() {
  const { selectedCourse } = useCourse();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (selectedCourse?.id) {
      fetchCertificate();
    }
  }, [selectedCourse]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student/certificate?courseId=${selectedCourse?.id}`);
      const data = await response.json();

      if (data.success && data.hasCertificate) {
        setCertificate(data.certificate);
        setCompletionStatus(null);
      } else if (data.success && !data.hasCertificate) {
        setCertificate(null);
        setCompletionStatus(data.completionStatus);
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (certificate && selectedCourse?.id) {
      window.open(`/api/student/certificate/download?courseId=${selectedCourse.id}`, '_blank');
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRegenerateCertificate = async () => {
    if (!selectedCourse?.id) return;
    
    const confirmRegen = window.confirm('Are you sure you want to regenerate your certificate? This will delete the existing one.');
    if (!confirmRegen) return;

    try {
      setLoading(true);
      // Delete existing certificate
      const deleteResponse = await fetch(`/api/student/certificate/regenerate?courseId=${selectedCourse.id}`, {
        method: 'DELETE'
      });
      
      if (deleteResponse.ok) {
        alert('Certificate deleted. Refreshing to generate new one...');
        // Refresh to trigger new certificate generation
        await fetchCertificate();
      } else {
        alert('Failed to delete certificate');
      }
    } catch (error) {
      console.error('Error regenerating certificate:', error);
      alert('Error regenerating certificate');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Course Selected</h2>
          <p className="text-gray-600">Please select a course to view your certificate</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Certificate</h1>
          <p className="text-gray-600">
            {certificate 
              ? 'Congratulations! You have earned your certificate.' 
              : 'Complete all requirements to earn your certificate'}
          </p>
        </div>

        {certificate ? (
          <div className="space-y-6">
            {/* Certificate Controls */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleRegenerateCertificate}
                variant="outline"
                className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
              >
                <RotateCw className="h-4 w-4" />
                Regenerate Certificate
              </Button>
              <Button
                onClick={handleFlip}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCw className="h-4 w-4" />
                Flip Certificate
              </Button>
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>

            {/* Certificate Card with Flip Animation */}
            <div className="perspective-1000">
              <div 
                className={`relative w-full transition-transform duration-700 transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* Front Side */}
                <div 
                  className="backface-hidden"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="relative">
                    <Image 
                      src="/student/Certificate_Front.jpg" 
                      alt="Certificate Front" 
                      width={1200}
                      height={800}
                      className="w-full h-auto rounded-2xl shadow-2xl"
                      priority
                    />
                  </div>
                </div>

                {/* Back Side */}
                <div 
                  className="absolute inset-0 backface-hidden"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="relative">
                    <Image 
                      src="/student/Certificate_Rear.jpg" 
                      alt="Certificate Rear" 
                      width={1200}
                      height={800}
                      className="w-full h-auto rounded-2xl shadow-2xl"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : completionStatus ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Completion Status</h2>
            
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm font-bold text-gray-900">{completionStatus.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${completionStatus.completionPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${completionStatus.preSurveyCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Pre-Survey</span>
                  {completionStatus.preSurveyCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${completionStatus.postSurveyCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Post-Survey</span>
                  {completionStatus.postSurveyCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${completionStatus.ideasCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Idea Submission</span>
                  {completionStatus.ideasCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${completionStatus.learningModulesCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    Learning Modules ({completionStatus.completedModules}/{completionStatus.totalModules})
                  </span>
                  {completionStatus.learningModulesCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {completionStatus.completionPercentage < 100 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Complete all requirements to earn your certificate. You're {100 - completionStatus.completionPercentage}% away!
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  )
}
