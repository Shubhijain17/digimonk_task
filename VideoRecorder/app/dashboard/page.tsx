'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/features/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { VideoRecorder } from '@/components/features/video'
import { api } from '@/lib/api'
import type { Video } from '@/types'
import { FaPlay, FaTrash, FaBox, FaCalendar, FaUser, FaVideo, FaSignOutAlt } from 'react-icons/fa'

function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRecorder, setShowRecorder] = useState(false)
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const videosData = await api.getVideos()
      if (videosData.status === 'success' && videosData.data) {
        // Backend returns array directly in data field
        setVideos(Array.isArray(videosData.data) ? videosData.data : [])
      }
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch videos')
      console.error('API Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleRecordingComplete = () => {
    setShowRecorder(false)
    fetchVideos() // Refresh video list
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const handleDeleteVideo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return
    }

    try {
      await api.deleteVideo(id)
      fetchVideos() // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete video')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Video Recorder</h1>
              <span className="hidden sm:inline-block text-sm text-muted-foreground">
                Welcome, <span className="font-medium">{user?.username}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                onClick={() => setShowRecorder(!showRecorder)}
                size="sm"
                className="text-sm"
              >
                <FaVideo className="mr-2" />
                {showRecorder ? 'Hide' : 'Record'}
              </Button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100">
                <span className="text-xs text-muted-foreground">Role:</span>
                <span className="text-sm font-medium capitalize">{user?.role}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                size="sm"
                className="text-sm"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Video Recorder */}
        {showRecorder && (
          <div className="mb-6">
            <VideoRecorder onRecordingComplete={handleRecordingComplete} />
          </div>
        )}

        {/* Videos Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.role === 'admin' ? 'All Recordings' : 'My Recordings'}
              {videos.length > 0 && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  ({videos.length})
                </span>
              )}
            </h2>
          </div>
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {!loading && !error && videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <Card
                    key={video.id}
                    className="flex flex-col overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-200"
                  >
                    {/* Video Thumbnail/Player */}
                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden aspect-video group">
                      {playingVideoId === video.id ? (
                        <video
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                          onEnded={() => setPlayingVideoId(null)}
                        >
                          <source
                            src={api.getVideoStreamUrl(video.id)}
                            type="video/webm"
                          />
                          <source
                            src={api.getVideoStreamUrl(video.id)}
                            type="video/mp4"
                          />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Button
                              onClick={() => setPlayingVideoId(video.id)}
                              size="lg"
                              className="bg-white/90 hover:bg-white text-gray-900 rounded-full w-14 h-14 p-0 shadow-lg transition-transform hover:scale-110"
                            >
                              <FaPlay className="text-xl ml-1" />
                            </Button>
                          </div>
                          {/* Delete button overlay */}
                          {(user?.role === 'admin' || video.createdBy === user?.username) && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteVideo(video.id)}
                                className="h-8 w-8 p-0 rounded-full shadow-md"
                              >
                                <FaTrash className="text-sm" />
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Video Info */}
                    <CardContent className="p-4 flex-1 flex flex-col bg-white">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-gray-900">
                        {video.title || video.originalName || 'Untitled Video'}
                      </h3>
                      <div className="text-xs text-gray-500 space-y-1 mt-auto">
                        <p className="flex items-center gap-1.5">
                          <FaBox className="text-xs" />
                          <span>{formatFileSize(video.size)}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <FaCalendar className="text-xs" />
                          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                        </p>
                        {user?.role === 'admin' && video.createdBy && (
                          <p className="flex items-center gap-1.5">
                            <FaUser className="text-xs" />
                            <span>{video.createdBy}</span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          {!loading && !error && videos.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <FaVideo className="text-6xl mb-4 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mb-4 text-lg">No videos found.</p>
                <Button onClick={() => setShowRecorder(true)} size="lg">
                  Record Your First Video
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

