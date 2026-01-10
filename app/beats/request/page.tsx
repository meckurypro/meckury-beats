'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mic,
  MicOff,
  Upload,
  X,
  Link as LinkIcon,
  Plus,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function BeatRequestPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [referenceUrls, setReferenceUrls] = useState<string[]>([''])
  const [voiceNoteFile, setVoiceNoteFile] = useState<File | null>(null)
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    checkAuth()
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to request a beat')
      router.push('/auth/signin')
      return
    }
    setUser(user)
  }

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) {
            stopRecording()
            return 120
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Could not access microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const deleteRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  const togglePlayback = () => {
    if (!audioBlob) return

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(URL.createObjectURL(audioBlob))
        audioRef.current.onended = () => setIsPlaying(false)
      }
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Reference URL handlers
  const addReferenceUrl = () => {
    if (referenceUrls.length < 5) {
      setReferenceUrls([...referenceUrls, ''])
    }
  }

  const updateReferenceUrl = (index: number, value: string) => {
    const newUrls = [...referenceUrls]
    newUrls[index] = value
    setReferenceUrls(newUrls)
  }

  const removeReferenceUrl = (index: number) => {
    if (referenceUrls.length > 1) {
      setReferenceUrls(referenceUrls.filter((_, i) => i !== index))
    }
  }

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (6MB max)
    if (file.size > 6 * 1024 * 1024) {
      toast.error('File too large. Maximum 6MB allowed.')
      return
    }

    // Check file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file')
      return
    }

    setVoiceNoteFile(file)
  }

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please sign in first')
      return
    }

    // Validation
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }

    const validUrls = referenceUrls.filter((url) => url.trim() !== '')
    if (validUrls.length === 0) {
      toast.error('Please add at least one reference URL')
      return
    }

    setLoading(true)

    try {
      let voiceNoteUrl = null

      // Upload voice note if exists (either recorded or file)
      if (audioBlob || voiceNoteFile) {
        const fileToUpload = audioBlob 
          ? new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' })
          : voiceNoteFile!

        const fileName = `${user.id}/${Date.now()}-${fileToUpload.name}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('beat-request-voices')
          .upload(fileName, fileToUpload)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('beat-request-voices')
          .getPublicUrl(fileName)

        voiceNoteUrl = urlData.publicUrl
      }

      // Insert beat request
      const { error: insertError } = await supabase
        .from('beat_requests')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          reference_urls: validUrls,
          voice_note_url: voiceNoteUrl,
          status: 'pending',
        })

      if (insertError) throw insertError

      toast.success('Beat request submitted successfully! 🎵')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <Sparkles className="w-8 h-8 text-meckury-primary" />
              <h1 className="text-5xl font-display font-bold text-white">
                Request a Custom Beat
              </h1>
            </div>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Share your vision with Meckury. Provide reference tracks, detailed descriptions, 
              and even voice notes to help bring your perfect beat to life.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title */}
            <div className="card">
              <label className="block text-white font-semibold mb-2">
                Beat Title / Working Name *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g., "Dark Trap Beat" or "Emotional R&B Instrumental"'
                className="input w-full"
                maxLength={100}
                required
              />
              <p className="text-text-muted text-sm mt-2">
                What would you like to call this beat?
              </p>
            </div>

            {/* Description */}
            <div className="card">
              <label className="block text-white font-semibold mb-2">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the vibe, genre, tempo, instruments, mood, and any specific elements you want. The more detail, the better!"
                className="input w-full min-h-[150px] resize-y"
                maxLength={2000}
                required
              />
              <p className="text-text-muted text-sm mt-2">
                {description.length}/2000 characters
              </p>
            </div>

            {/* Reference URLs */}
            <div className="card">
              <label className="block text-white font-semibold mb-2">
                Reference Tracks * (1-5 links)
              </label>
              <p className="text-text-secondary text-sm mb-4">
                Share links to songs that inspire the sound you're looking for 
                (YouTube, Spotify, SoundCloud, etc.)
              </p>
              
              <div className="space-y-3">
                {referenceUrls.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5 text-meckury-primary flex-shrink-0" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateReferenceUrl(index, e.target.value)}
                      placeholder={`Reference track #${index + 1}`}
                      className="input flex-1"
                    />
                    {referenceUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReferenceUrl(index)}
                        className="p-2 text-meckury-danger hover:bg-meckury-danger hover:bg-opacity-10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {referenceUrls.length < 5 && (
                <button
                  type="button"
                  onClick={addReferenceUrl}
                  className="mt-3 flex items-center space-x-2 text-meckury-primary hover:text-meckury-accent transition-colors font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Another Reference</span>
                </button>
              )}
            </div>

            {/* Voice Note Section */}
            <div className="card">
              <label className="block text-white font-semibold mb-2">
                Voice Note (Optional)
              </label>
              <p className="text-text-secondary text-sm mb-4">
                Record yourself humming, singing, or describing the vibe. 
                Max 2 minutes. You can also upload an audio file (6MB max).
              </p>

              {/* Recording Interface */}
              {!audioBlob && !voiceNoteFile && (
                <div className="space-y-4">
                  {/* Record Button */}
                  <div className="flex items-center justify-center">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="btn-primary flex items-center space-x-2 px-8 py-4"
                      >
                        <Mic className="w-6 h-6" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-4 h-4 bg-meckury-danger rounded-full animate-pulse"></div>
                          <span className="text-2xl font-mono text-white">
                            {formatTime(recordingTime)}
                          </span>
                          <span className="text-text-muted">/ 2:00</span>
                        </div>
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="btn-outline flex items-center space-x-2"
                        >
                          <MicOff className="w-5 h-5" />
                          <span>Stop Recording</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Or Upload File */}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 border-t border-meckury-mediumGray"></div>
                    <span className="text-text-muted text-sm">OR</span>
                    <div className="flex-1 border-t border-meckury-mediumGray"></div>
                  </div>

                  <label className="btn-outline flex items-center justify-center space-x-2 cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <span>Upload Audio File</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Recorded Audio Playback */}
              {audioBlob && (
                <div className="bg-background-elevated rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-meckury-success" />
                      <span className="text-white font-semibold">
                        Voice Note Recorded
                      </span>
                    </div>
                    <span className="text-text-muted text-sm">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="btn-outline flex items-center space-x-2 text-meckury-danger hover:bg-meckury-danger hover:bg-opacity-10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Uploaded File Display */}
              {voiceNoteFile && (
                <div className="bg-background-elevated rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-meckury-success" />
                      <div>
                        <p className="text-white font-semibold">
                          {voiceNoteFile.name}
                        </p>
                        <p className="text-text-muted text-sm">
                          {(voiceNoteFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setVoiceNoteFile(null)}
                      className="p-2 text-meckury-danger hover:bg-meckury-danger hover:bg-opacity-10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Info Alert */}
            <div className="card bg-meckury-primary bg-opacity-10 border border-meckury-primary">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-meckury-primary flex-shrink-0 mt-1" />
                <div className="text-sm text-text-secondary space-y-2">
                  <p>
                    <strong className="text-white">What happens next?</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your request will be reviewed by Meckury</li>
                    <li>Once your beat is created, you'll be notified</li>
                    <li>The beat will be available for purchase (lease or exclusive)</li>
                    <li>You'll have first access before it's released publicly</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
              >
                {loading ? (
                  <>
                    <div className="spinner w-5 h-5"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Submit Beat Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}
