'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface VideoRecorderProps {
  onRecordingComplete?: () => void
}

export function VideoRecorder({ onRecordingComplete }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState('')
  const [recordingTime, setRecordingTime] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
  const { user } = useAuth()

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
        (window.innerWidth <= 768 && window.innerHeight <= 1024)
      setIsMobile(isMobileDevice)
    }

    checkMobile()
  }, [])

  // Check for multiple cameras
  const checkAvailableCameras = async () => {
    try {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) ||
        (window.innerWidth <= 768 && window.innerHeight <= 1024)
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      if (isMobileDevice) {
        // Check if we have both front and back cameras
        const hasFront = videoDevices.some(device => 
          device.label.toLowerCase().includes('front') || 
          device.label.toLowerCase().includes('user') ||
          device.label.toLowerCase().includes('facing')
        )
        const hasBack = videoDevices.some(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment') ||
          device.label.toLowerCase().includes('rear')
        )
        
        // Enable switch if we have multiple cameras or more than one device
        setHasMultipleCameras(hasFront && hasBack || videoDevices.length > 1)
      } else {
        setHasMultipleCameras(false)
      }
    } catch (error) {
      console.error('Error checking cameras:', error)
      setHasMultipleCameras(false)
    }
  }

  const startCamera = async () => {
    try {
      setHasPermission(null)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      setHasPermission(true)
      
      await checkAvailableCameras()
    } catch (error: any) {
      console.error('Error accessing camera:', error)
      setHasPermission(false)
      if (error.name === 'NotAllowedError') {
        alert('Camera permission denied. Please allow camera access and try again.')
      } else if (error.name === 'NotFoundError') {
        alert('No camera found on this device.')
      } else {
        alert('Error accessing camera: ' + error.message)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const switchCamera = async () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    setTimeout(() => {
      startCamera()
    }, 100)
  }

  const startRecording = () => {
    if (!streamRef.current) {
      alert('Please start camera first')
      return
    }

    const chunks: Blob[] = []
    setRecordedChunks(chunks)
    setVideoUrl(null)
    setRecordingTime(0)

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setVideoUrl(url)
        setRecordedChunks(chunks)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      ;(mediaRecorder as any).timer = timer
    } catch (error: any) {
      console.error('Error starting recording:', error)
      alert('Error starting recording: ' + error.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if ((mediaRecorderRef.current as any).timer) {
        clearInterval((mediaRecorderRef.current as any).timer)
      }
    }
  }

  // Upload video
  const uploadVideo = async () => {
    if (recordedChunks.length === 0) {
      alert('No video recorded')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' })
      const formData = new FormData()
      
      // Convert webm to a file with .webm extension
      const file = new File([blob], `recording-${Date.now()}.webm`, {
        type: 'video/webm'
      })
      
      formData.append('video', file)
      formData.append('title', videoTitle || `Recording ${new Date().toLocaleString()}`)

      const response = await api.uploadVideo(formData)

      if (response.status === 'success') {
        alert('Video uploaded successfully!')
        // Reset
        setRecordedChunks([])
        setVideoUrl(null)
        setVideoTitle('')
        setRecordingTime(0)
        
        if (onRecordingComplete) {
          onRecordingComplete()
        }
      }
    } catch (error: any) {
      console.error('Error uploading video:', error)
      setUploadError(error.response?.data?.message || error.message || 'Failed to upload video')
    } finally {
      setIsUploading(false)
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Record Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {hasPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <p className="mb-2">Camera permission denied</p>
                <Button onClick={startCamera} size="sm">Grant Permission</Button>
              </div>
            </div>
          )}
          
          {hasPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p>Click "Start Camera" to begin</p>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {isRecording && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {!streamRef.current ? (
            <Button onClick={startCamera} className="flex-1">
              Start Camera
            </Button>
          ) : (
            <>
              <Button
                onClick={switchCamera}
                variant="outline"
                disabled={isRecording || !isMobile || !hasMultipleCameras}
                title={!isMobile ? 'Camera switching only available on mobile devices' : !hasMultipleCameras ? 'Only one camera available' : ''}
              >
                Switch Camera ({facingMode === 'user' ? 'Front' : 'Back'})
              </Button>
              
              {!isRecording ? (
                <Button onClick={startRecording} className="flex-1">
                  Start Recording
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="flex-1">
                  Stop Recording
                </Button>
              )}
            </>
          )}
        </div>

        {/* Recorded Video Preview */}
        {videoUrl && (
          <div className="space-y-2">
            <Label>Recorded Video Preview</Label>
            <video
              src={videoUrl}
              controls
              className="w-full rounded-lg"
            />
            
            <div className="space-y-2">
              <Label htmlFor="videoTitle">Video Title (optional)</Label>
              <Input
                id="videoTitle"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Enter video title"
              />
            </div>

            {uploadError && (
              <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm text-destructive">{uploadError}</p>
              </div>
            )}

            <Button
              onClick={uploadVideo}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

