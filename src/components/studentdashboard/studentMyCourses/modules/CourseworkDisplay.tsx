"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Video, 
  Link, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Circle,
  ExternalLink,
  Download
} from "lucide-react"

interface CourseworkItem {
  id: string
  title: string
  description?: string
  workType: string
  dueDate?: string
  maxPoints?: number
  creationTime?: string
  updateTime?: string
  alternateLink?: string
  materials?: any[]
}

interface Submission {
  id: string
  courseWorkId: string
  state: string
  assignedGrade?: number
  draftGrade?: number
  submitted: boolean
  late: boolean
  updateTime?: string
  creationTime?: string
}

interface CourseworkDisplayProps {
  courseworkData: {
    course: any
    courseWork: CourseworkItem[]
    submissions: Submission[]
  } | null
  loading: boolean
}

export function CourseworkDisplay({ courseworkData, loading }: CourseworkDisplayProps) {
  const [selectedItem, setSelectedItem] = useState<CourseworkItem | null>(null)

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading course content...</p>
      </div>
    )
  }

  if (!courseworkData || !courseworkData.courseWork || courseworkData.courseWork.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Coursework Available</h3>
        <p className="text-muted-foreground">
          This course doesn't have any assignments or materials yet.
        </p>
      </div>
    )
  }

  const getWorkTypeIcon = (workType: string) => {
    switch (workType) {
      case 'ASSIGNMENT':
        return <FileText className="h-4 w-4" />
      case 'QUIZ':
        return <FileText className="h-4 w-4" />
      case 'MATERIAL':
        return <Link className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case 'ASSIGNMENT':
        return 'bg-blue-100 text-blue-800'
      case 'QUIZ':
        return 'bg-purple-100 text-purple-800'
      case 'MATERIAL':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSubmissionStatus = (item: CourseworkItem) => {
    const submission = courseworkData.submissions.find(sub => sub.courseWorkId === item.id)
    if (!submission) return { status: 'not_started', text: 'Not Started', color: 'text-gray-500' }
    
    switch (submission.state) {
      case 'TURNED_IN':
        return { status: 'submitted', text: 'Submitted', color: 'text-green-600' }
      case 'RETURNED':
        return { status: 'graded', text: 'Graded', color: 'text-blue-600' }
      case 'NEW':
        return { status: 'draft', text: 'Draft', color: 'text-yellow-600' }
      default:
        return { status: 'unknown', text: 'Unknown', color: 'text-gray-500' }
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-white rounded-xl p-6 border">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {courseworkData.course.name}
        </h2>
        {courseworkData.course.section && (
          <p className="text-muted-foreground mb-4">{courseworkData.course.section}</p>
        )}
        {courseworkData.course.description && (
          <p className="text-sm text-muted-foreground">{courseworkData.course.description}</p>
        )}
      </div>

      {/* Coursework Items */}
      <div className="space-y-4">
        {courseworkData.courseWork.map((item) => {
          const submissionStatus = getSubmissionStatus(item)
          const submission = courseworkData.submissions.find(sub => sub.courseWorkId === item.id)
          
          return (
            <Card 
              key={item.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedItem?.id === item.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedItem(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getWorkTypeIcon(item.workType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1">{item.title}</CardTitle>
                      {item.description && (
                        <CardDescription className="line-clamp-2">
                          {item.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge className={getWorkTypeColor(item.workType)}>
                      {item.workType}
                    </Badge>
                    {submissionStatus.status === 'submitted' || submissionStatus.status === 'graded' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    {item.dueDate && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {formatDate(item.dueDate)}</span>
                      </div>
                    )}
                    {item.maxPoints && (
                      <div className="flex items-center space-x-1">
                        <span>{item.maxPoints} points</span>
                      </div>
                    )}
                    {submission?.assignedGrade !== undefined && (
                      <div className="flex items-center space-x-1 text-blue-600">
                        <span>Grade: {submission.assignedGrade}/{item.maxPoints}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={submissionStatus.color}>
                      {submissionStatus.text}
                    </span>
                    {item.alternateLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(item.alternateLink, '_blank')
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selected Item Details */}
      {selectedItem && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{selectedItem.title}</CardTitle>
                <CardDescription className="mt-2">
                  {selectedItem.description || 'No description available'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Details</h4>
                <div className="space-y-1 text-muted-foreground">
                  <div>Type: {selectedItem.workType}</div>
                  {selectedItem.dueDate && (
                    <div>Due: {formatDate(selectedItem.dueDate)}</div>
                  )}
                  {selectedItem.maxPoints && (
                    <div>Points: {selectedItem.maxPoints}</div>
                  )}
                  {selectedItem.creationTime && (
                    <div>Created: {formatDateTime(selectedItem.creationTime)}</div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Submission Status</h4>
                <div className="space-y-1 text-muted-foreground">
                  {(() => {
                    const submission = courseworkData.submissions.find(sub => sub.courseWorkId === selectedItem.id)
                    if (!submission) return <div>Not started</div>
                    
                    return (
                      <>
                        <div>Status: {submission.state}</div>
                        {submission.assignedGrade !== undefined && (
                          <div>Grade: {submission.assignedGrade}/{selectedItem.maxPoints}</div>
                        )}
                        {submission.updateTime && (
                          <div>Last updated: {formatDateTime(submission.updateTime)}</div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
            
            {selectedItem.alternateLink && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={() => window.open(selectedItem.alternateLink, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Google Classroom
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
