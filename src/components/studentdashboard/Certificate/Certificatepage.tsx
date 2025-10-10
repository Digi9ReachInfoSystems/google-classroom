"use client"
import React, { useState, useEffect } from 'react'
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
                  <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 shadow-2xl">
                    <div className="bg-white rounded-xl p-12 relative">
                      {/* Decorative Corner */}
                      <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-purple-600 rounded-tl-xl"></div>
                      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-purple-600 rounded-br-xl"></div>

                      {/* Certificate Content */}
                      <div className="text-center space-y-6">
                        <h2 className="text-5xl font-bold text-purple-600 tracking-wider">CERTIFICATE</h2>
                        <p className="text-xl text-gray-600 italic">of Completion</p>

                        <div className="py-6">
                          <p className="text-lg text-gray-700 mb-4">This is to certify that</p>
                          <h3 className="text-4xl font-bold text-gray-900 border-b-2 border-purple-600 inline-block pb-2 px-8">
                            {certificate.studentName}
                          </h3>
                        </div>

                        <p className="text-lg text-gray-700">has successfully completed</p>

                        <h4 className="text-2xl font-semibold text-gray-800">
                          {certificate.courseName}
                        </h4>

                        <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed pt-4">
                          This certificate is awarded in recognition of completing all course requirements including
                          pre-survey, learning modules, idea submission, and post-survey with 100% completion.
                        </p>

                        {/* Details Row */}
                        <div className="flex justify-around pt-8 border-t-2 border-gray-200 mt-8">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Certificate No.</p>
                            <p className="text-sm font-semibold text-gray-800">{certificate.certificateNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Date Issued</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Modules Completed</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {certificate.completionData.completedModules}/{certificate.completionData.totalModules}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Gold Seal */}
                      <div className="absolute bottom-8 right-8 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-4 border-yellow-700 flex items-center justify-center shadow-lg">
                        <span className="text-xs font-bold text-yellow-900 text-center leading-tight">
                          VERIFIED<br/>AUTHENTIC
                        </span>
                      </div>
                    </div>
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
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl h-full">
                    <div className="bg-white rounded-xl p-12 h-full flex flex-col justify-center">
                      <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">Certificate Details</h3>
                      
                      <div className="space-y-6">
                        <div className="border-b pb-4">
                          <p className="text-sm text-gray-600 mb-1">Student Name</p>
                          <p className="text-lg font-semibold text-gray-900">{certificate.studentName}</p>
                        </div>

                        <div className="border-b pb-4">
                          <p className="text-sm text-gray-600 mb-1">Course Name</p>
                          <p className="text-lg font-semibold text-gray-900">{certificate.courseName}</p>
                        </div>

                        <div className="border-b pb-4">
                          <p className="text-sm text-gray-600 mb-1">Certificate Number</p>
                          <p className="text-lg font-semibold text-gray-900">{certificate.certificateNumber}</p>
                        </div>

                        <div className="border-b pb-4">
                          <p className="text-sm text-gray-600 mb-3">Completion Status</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-sm text-gray-700">Pre-Survey</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-sm text-gray-700">Post-Survey</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-sm text-gray-700">Ideas Submitted</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              <span className="text-sm text-gray-700">Learning Modules</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Issue Date</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {new Date(certificate.issuedAt).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
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
