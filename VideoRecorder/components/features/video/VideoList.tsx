'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Video } from '@/types'
import { FaPlay, FaTrash } from 'react-icons/fa'

interface VideoListProps {
  onRefresh?: () => void
}

export function VideoList({ onRefresh }: VideoListProps) {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getVideos()
      if (response.status === 'success' && response.data) {
        setVideos(Array.isArray(response.data) ? response.data : [])
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch videos')
      console.error('Error fetching videos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return
    }

    try {
      await api.deleteVideo(id)
      setVideos(videos.filter(v => v.id !== id))
      if (onRefresh) {
        onRefresh()
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete video')
      console.error('Error deleting video:', err)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getVideoUrl = (id: number) => {
    return api.getVideoStreamUrl(id)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading videos...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchVideos} className="mt-2" variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Videos ({videos.length})</CardTitle>
        <Button onClick={fetchVideos} variant="outline" size="sm">
          🔄 Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {videos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No videos recorded yet. Start recording to see your videos here.
          </p>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{video.title}</h3>
                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                      <p>Size: {formatFileSize(video.size)}</p>
                      <p>Recorded: {new Date(video.createdAt).toLocaleString()}</p>
                      {user?.role === 'admin' && (
                        <p>By: {video.createdBy}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(user?.role === 'admin' || video.createdBy === user?.username) && (
                      <Button
                        onClick={() => handleDelete(video.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <FaTrash className="mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {playingVideoId === video.id ? (
                  <div className="space-y-2">
                    <video
                      controls
                      className="w-full rounded-lg bg-black"
                      style={{ maxHeight: '400px' }}
                    >
                      <source src={getVideoUrl(video.id)} type={video.mimetype || 'video/webm'} />
                      Your browser does not support the video tag.
                    </video>
                    <Button
                      onClick={() => setPlayingVideoId(null)}
                      variant="outline"
                      className="w-full"
                    >
                      Close Player
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setPlayingVideoId(video.id)}
                    className="w-full"
                  >
                    <FaPlay className="mr-2" />
                    Play Video
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

