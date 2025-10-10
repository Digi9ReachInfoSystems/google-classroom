"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Circle, PlayCircle, FileText, Link as LinkIcon, Download, ExternalLink } from "lucide-react"

interface CourseMaterial {
  id: string
  title: string
  description?: string
  workType: string
  materials?: any[]
  dueDate?: any
  maxPoints?: number
  state?: string
  submission?: {
    state: string
    assignedGrade?: number
  }
}

interface CourseMaterialsProps {
  courseId: string
  studentEmail: string
  selectedMaterialId?: string | null
  onAllComplete: () => void
  submitting: boolean
}

export default function CourseMaterials({ courseId, studentEmail, selectedMaterialId, onAllComplete, submitting }: CourseMaterialsProps) {
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourseMaterials()
  }, [courseId])

  // Update selected material when selectedMaterialId changes
  useEffect(() => {
    if (selectedMaterialId && materials.length > 0) {
      const material = materials.find(m => m.id === selectedMaterialId)
      if (material) {
        setSelectedMaterial(material)
      }
    }
  }, [selectedMaterialId, materials])

  const fetchCourseMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/coursework?courseId=${courseId}`)
      const data = await response.json()

      if (data.success) {
        // Filter out survey and idea assignments
        const courseMaterials = data.coursework.filter((item: any) => {
          const title = item.title?.toLowerCase() || ''
          return !title.includes('survey') && !title.includes('idea')
        })
        setMaterials(courseMaterials)
        
        // Auto-select first material
        if (courseMaterials.length > 0) {
          setSelectedMaterial(courseMaterials[0])
        }
      } else {
        setError('Failed to load course materials')
      }
    } catch (err) {
      console.error('Error fetching course materials:', err)
      setError('Failed to load course materials')
    } finally {
      setLoading(false)
    }
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }
    return null
  }

  const handleMarkMaterialComplete = async (materialId: string) => {
    try {
      // Find current index before making the API call
      const currentIndex = materials.findIndex(m => m.id === materialId);
      const nextMaterialId = currentIndex !== -1 && currentIndex < materials.length - 1 
        ? materials[currentIndex + 1].id 
        : null;
      
      const response = await fetch('/api/student/mark-material-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseWorkId: materialId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh materials to show updated completion status
        const refreshResponse = await fetch(`/api/student/coursework?courseId=${courseId}`);
        const refreshData = await refreshResponse.json();

        if (refreshData.success) {
          const updatedMaterials = refreshData.coursework.filter((item: any) => {
            const title = item.title?.toLowerCase() || '';
            return !title.includes('survey') && !title.includes('idea');
          });
          setMaterials(updatedMaterials);

          // Auto-select next material after refresh
          if (nextMaterialId) {
            const nextMaterial = updatedMaterials.find((m: any) => m.id === nextMaterialId);
            if (nextMaterial) {
              setSelectedMaterial(nextMaterial);
            }
          } else {
            // Update current material to show completion
            const currentMaterial = updatedMaterials.find((m: any) => m.id === materialId);
            if (currentMaterial) {
              setSelectedMaterial(currentMaterial);
            }
          }
        }
      } else {
        console.error('Failed to mark material complete:', data.message);
      }
    } catch (error) {
      console.error('Error marking material complete:', error)
    }
  }

  const renderSelectedMaterialContent = () => {
    if (!selectedMaterial) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Select a material to view
        </div>
      )
    }

    const isCompleted = selectedMaterial.submission?.state === 'TURNED_IN'

    return (
      <div className="space-y-6">
        {/* Material Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{selectedMaterial.title}</h2>
              {selectedMaterial.description && (
                <p className="text-muted-foreground">{selectedMaterial.description}</p>
              )}
            </div>
            {!isCompleted && (
              <Button
                onClick={() => handleMarkMaterialComplete(selectedMaterial.id)}
                size="sm"
                className="bg-green-500 hover:bg-green-600 flex-shrink-0"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm">
            {selectedMaterial.maxPoints && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                {selectedMaterial.maxPoints} points
              </span>
            )}
            {isCompleted && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Material Content */}
        {selectedMaterial.materials && selectedMaterial.materials.length > 0 ? (
          <div className="space-y-4">
            {selectedMaterial.materials.map((item: any, index: number) => {
              // YouTube Video
              if (item.youtubeVideo) {
                return (
                  <div key={index} className="space-y-3">
                    <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                      <iframe
                        src={`https://www.youtube.com/embed/${item.youtubeVideo.id}`}
                        title={item.youtubeVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.youtubeVideo.title}</p>
                  </div>
                )
              }

              // Link (check if it's a YouTube link or Google Form)
              if (item.link) {
                const youtubeEmbedUrl = getYouTubeEmbedUrl(item.link.url)
                
                // Check if it's a YouTube video
                if (youtubeEmbedUrl) {
                  return (
                    <div key={index} className="space-y-3">
                      <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                        <iframe
                          src={youtubeEmbedUrl}
                          title={item.link.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{item.link.title}</p>
                    </div>
                  )
                }

                // Check if it's a Google Form
                if (item.link.url && (item.link.url.includes('docs.google.com/forms') || item.link.url.includes('forms.gle'))) {
                  console.log('Rendering Google Form from link:', item.link);
                  // Convert form URL to embedded version
                  let formEmbedUrl = item.link.url;
                  if (formEmbedUrl.includes('/viewform')) {
                    formEmbedUrl = formEmbedUrl.replace('/viewform', '/viewform?embedded=true');
                    // Remove any existing query params after viewform and replace with embedded
                    formEmbedUrl = formEmbedUrl.split('?')[0] + '?embedded=true';
                  } else if (!formEmbedUrl.includes('embedded=true')) {
                    formEmbedUrl += (formEmbedUrl.includes('?') ? '&' : '?') + 'embedded=true';
                  }
                  console.log('Form embed URL:', formEmbedUrl);

                  return (
                    <div key={index} className="space-y-3">
                      <h3 className="text-lg font-semibold">Assignment</h3>
                      <div className="w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg bg-white" style={{ height: '650px', minHeight: '650px' }}>
                        <iframe
                          src={formEmbedUrl}
                          title={item.link.title || 'Assignment'}
                          className="w-full h-full border-0"
                          style={{ border: 0 }}
                          loading="lazy"
                        >
                          Loading form...
                        </iframe>
                      </div>
                      {item.link.title && (
                        <p className="text-sm text-muted-foreground">{item.link.title}</p>
                      )}
                    </div>
                  )
                }

                // Regular link
                return (
                  <a
                    key={index}
                    href={item.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  >
                    <LinkIcon className="h-6 w-6 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-blue-600 transition-colors truncate">
                        {item.link.title || 'Link'}
                      </p>
                      {item.link.url && (
                        <p className="text-sm text-muted-foreground truncate">{item.link.url}</p>
                      )}
                    </div>
                    <ExternalLink className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </a>
                )
              }

              // Drive File
              if (item.driveFile) {
                return (
                  <a
                    key={index}
                    href={item.driveFile.alternateLink || item.driveFile.driveFile?.alternateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  >
                    <FileText className="h-6 w-6 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-blue-600 transition-colors truncate">
                        {item.driveFile.title || item.driveFile.driveFile?.title || 'File'}
                      </p>
                    </div>
                    <Download className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </a>
                )
              }

              // Google Form
              if (item.form) {
                console.log('Rendering form:', item.form);
                // Convert form URL to embedded version
                let formEmbedUrl = item.form.formUrl;
                if (formEmbedUrl.includes('/viewform')) {
                  formEmbedUrl = formEmbedUrl.replace('/viewform', '/viewform?embedded=true');
                } else if (!formEmbedUrl.includes('embedded=true')) {
                  formEmbedUrl += (formEmbedUrl.includes('?') ? '&' : '?') + 'embedded=true';
                }
                console.log('Form embed URL:', formEmbedUrl);

                return (
                  <div key={index} className="space-y-3">
                    <h3 className="text-lg font-semibold">Google Form</h3>
                    <div className="w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg bg-white" style={{ height: '650px', minHeight: '650px' }}>
                      <iframe
                        src={formEmbedUrl}
                        title={item.form.title || 'Google Form'}
                        className="w-full h-full border-0"
                        style={{ border: 0 }}
                        loading="lazy"
                      >
                        Loading form...
                      </iframe>
                    </div>
                    {item.form.title && (
                      <p className="text-sm text-muted-foreground">{item.form.title}</p>
                    )}
                  </div>
                )
              }

              return null
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted rounded-lg">
            {selectedMaterial.description || 'No additional materials'}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const completedCount = materials.filter(m => m.submission?.state === 'TURNED_IN').length
  const allCompleted = completedCount >= materials.length && materials.length > 0

  console.log('Materials completion status:', {
    materials: materials.map(m => ({
      title: m.title,
      hasSubmission: !!m.submission,
      submissionState: m.submission?.state
    })),
    completedCount,
    totalCount: materials.length,
    allCompleted
  });

  return (
    <div className="space-y-6">
      {/* Main Content Area */}
      <Card className="min-h-[500px]">
        <CardContent className="p-6">
          {renderSelectedMaterialContent()}
        </CardContent>
      </Card>

      {/* Complete Button */}
      {allCompleted && (
        <div className="text-center">
          <Button 
            onClick={onAllComplete}
            disabled={submitting}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            {submitting ? 'Marking Complete...' : '✓ Mark Course as Complete'}
          </Button>
        </div>
      )}
    </div>
  )
}
