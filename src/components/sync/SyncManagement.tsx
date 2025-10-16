"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Database, Users, BookOpen } from "lucide-react"

interface SyncStatus {
  user: {
    email: string
    role: string
  }
  summary: {
    totalSyncs: number
    successfulSyncs: number
    failedSyncs: number
    inProgressSyncs: number
    successRate: number
    lastSuccessfulSync: {
      startTime: string
      endTime: string
      duration: number
      recordsSynced: number
    } | null
  }
  recentSyncs: Array<{
    syncId: string
    syncType: string
    status: string
    startTime: string
    endTime: string
    duration: number
    recordsProcessed: number
    recordsSynced: number
    recordsFailed: number
    errorMessage: string
  }>
}

export default function SyncManagement() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchSyncStatus()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/sync/status')
      const data = await response.json()

      if (data.success) {
        setSyncStatus(data.data)
      } else {
        setError(data.message || 'Failed to fetch sync status')
      }
    } catch (err) {
      setError('Failed to fetch sync status')
      console.error('Error fetching sync status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (syncType: 'full' | 'incremental' = 'full') => {
    try {
      setSyncing(true)
      const response = await fetch('/api/sync/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ syncType })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh status after successful sync
        await fetchSyncStatus()
      } else {
        setError(data.message || 'Sync failed')
      }
    } catch (err) {
      setError('Sync failed')
      console.error('Error syncing:', err)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (duration: number) => {
    if (duration < 1000) return `${duration}ms`
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
    return `${(duration / 60000).toFixed(1)}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sync status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Sync Status</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSyncStatus}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!syncStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No sync data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sync Management
            </h1>
            <p className="text-muted-foreground">
              Manage data synchronization from Google Classroom to MongoDB
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSync('full')}
              disabled={syncing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Full Sync'}
            </Button>
            <Button
              onClick={() => handleSync('incremental')}
              disabled={syncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Incremental Sync'}
            </Button>
          </div>
        </div>

        {/* Sync Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStatus.summary.totalSyncs}</div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.summary.successRate.toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{syncStatus.summary.successfulSyncs}</div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.summary.failedSyncs} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{syncStatus.summary.inProgressSyncs}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {syncStatus.summary.lastSuccessfulSync 
                  ? formatDuration(syncStatus.summary.lastSuccessfulSync.duration)
                  : '—'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {syncStatus.summary.lastSuccessfulSync 
                  ? new Date(syncStatus.summary.lastSuccessfulSync.startTime).toLocaleString()
                  : 'Never'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sync Progress */}
        {syncing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                Sync in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Syncing data from Google Classroom...</span>
                  <span className="text-sm text-muted-foreground">Please wait</span>
                </div>
                <Progress value={undefined} className="w-full" />
                <p className="text-xs text-muted-foreground">
                  This may take a few minutes depending on the amount of data
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Sync History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sync History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncStatus.recentSyncs.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sync history available</p>
                </div>
              ) : (
                syncStatus.recentSyncs.map((sync, index) => (
                  <div key={sync.syncId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(sync.status)}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{sync.syncType} Sync</span>
                          <Badge className={getStatusColor(sync.status)}>
                            {sync.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sync.startTime).toLocaleString()}
                        </p>
                        {sync.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">
                            Error: {sync.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {sync.recordsSynced} records synced
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sync.duration ? formatDuration(sync.duration) : '—'}
                      </div>
                      {sync.recordsFailed > 0 && (
                        <div className="text-xs text-red-600">
                          {sync.recordsFailed} failed
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sync Statistics */}
        {syncStatus.summary.lastSuccessfulSync && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Last Successful Sync Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {syncStatus.summary.lastSuccessfulSync.recordsSynced}
                  </div>
                  <p className="text-sm text-muted-foreground">Records Synced</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatDuration(syncStatus.summary.lastSuccessfulSync.duration)}
                  </div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {new Date(syncStatus.summary.lastSuccessfulSync.startTime).toLocaleDateString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

