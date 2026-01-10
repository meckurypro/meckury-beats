'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  Play, 
  Pause, 
  ThumbsUp, 
  RefreshCw, 
  ThumbsDown,
  Volume2,
  VolumeX,
  Music,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { formatDistanceToNow } from 'date-fns'

export default function ReviewBeatRequestPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const [request, setRequest] = useState<any>(null)
  const [beat, setBeat] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    checkAuth()
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchRequest()
    }
  }, [user])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to continue')
      router.push('/auth/signin')
      return
    }
    setUser(user)
  }

  const fetchRequest = async () => {
    try {
      const { data: reqData, error: reqError } = await supabase
        .from('beat_requests')
        .select(`
          *,
          beats!beat_requests_linked_beat_id_fkey (*)
        `)
        .eq('id', requestId)
        .single()

      if (reqError) throw reqError

      // Authorization check
      if (reqData.user_id !== user?.id) {
        toast.error('Unauthorized access')
        router.push('/dashboard')
        return
      }

      // Check if request is in correct status
      if (reqData.status !== 'awaiting_review') {
        toast.error('This request is not ready for review')
        router.push('/dashboard')
        return
      }

      setRequest(reqData)
      
      // Get beat data
      if (reqData.beats && reqData.beats.length > 0) {
        const beatData = reqData.beats[0]
        setBeat(beatData)
        
        // Initialize audio
        if (beatData.mp3_url) {
          const audio = new Audio(beatData.mp3_url)
          audio.crossOrigin = 'anonymous'
          audio.volume = volume
          
          audio.onloadedmetadata = () => {
            setDuration(audio.duration)
          }
          
          audio.ontimeupdate = () => {
            setCurrentTime(audio.currentTime)
          }
          
          audio.onended = () => {
            setIsPlaying(false)
            setCurrentTime(0)
          }
          
          audio.onerror = (e) => {
            console.error('Audio error:', e)
            toast.error('Failed to load audio')
          }
          
          audioRef.current = audio
        }
      } else {
        toast.error('No beat found for this request')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load request')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Playback error:', error)
          toast.error('Failed to play audio')
        })
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (audio && duration) {
      const rect = e.currentTarget.getBoundingClientRect()
      const percent = (e.clientX - rect.left) / rect.width
      audio.currentTime = percent * duration
      setCurrentTime(audio.currentTime)
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const toggleMute = () => {
    const newVolume = volume > 0 ? 0 : 1
    handleVolumeChange(newVolume)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const handleResponse = async (response: 'pass' | 'revision' | 'approved') => {
    if (processing) return
    
    // Confirmation dialogs
    if (response === 'pass') {
      const strikeCount = request.strike_count || 0
      const message = strikeCount === 0 
        ? 'Are you sure you want to pass on this beat? You will get one more chance with a new beat.'
        : 'Are you sure you want to pass? This is your final chance. You will receive a full refund of ₦10,000.'
      
      if (!confirm(message)) return
    }

    if (response === 'revision') {
      if (!confirm('Request a revision? The producer will modify this beat based on your feedback.')) return
    }

    setProcessing(true)

    try {
      let newStatus = request.status
      let strikeCount = request.strike_count || 0

      if (response === 'pass') {
        strikeCount += 1
        
        if (strikeCount >= 2) {
          // Second pass - initiate refund
          newStatus = 'refunded'
          
          // Make beat public
          if (beat) {
            await supabase
              .from('beats')
              .update({ active: true })
              .eq('id', beat.id)
          }
          
          toast.success('Refund initiated. You will receive ₦10,000 within 5-7 business days.')
        } else {
          // First pass - start new beat, make current one public
          newStatus = 'in_progress'
          
          // Make beat public
          if (beat) {
            await supabase
              .from('beats')
              .update({ active: true })
              .eq('id', beat.id)
          }
          
          toast.success('Beat will be made public. We\'ll create a new custom beat for you.')
        }
      } else if (response === 'revision') {
        const revisionCount = (request.revision_count || 0) + 1
        
        if (revisionCount > 1) {
          toast.error('Maximum 1 revision allowed per request')
          setProcessing(false)
          return
        }
        
        newStatus = 'revision_requested'
        toast.success('Revision requested. The producer will update the beat for you.')
      } else if (response === 'approved') {
        // Client loves it - redirect to final payment
        router.push(`/dashboard/beat-requests/${requestId}/purchase`)
        return
      }

      // Update request
      const { error } = await supabase
        .from('beat_requests')
        .update({
          client_response: response,
          status: newStatus,
          strike_count: strikeCount,
          revision_count: response === 'revision' ? (request.revision_count || 0) + 1 : request.revision_count,
        })
        .eq('id', requestId)

      if (error) throw error

      // Send notification email
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client_response',
          response,
          requestId: request.id,
          requestTitle: request.title,
        }),
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to submit response')
      setProcessing(false)
    }
  }

  if (loading || !request || !beat) {
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
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Review Your Custom Beat
            </h1>
            <p className="text-text-secondary">
              Listen carefully and choose your next step
            </p>
          </div>

          {/* Deadline Warning */}
          {request.response_deadline && (
            <div className="card bg-meckury-accent bg-opacity-10 border border-meckury-accent mb-8">
              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-meckury-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold">Response Deadline</p>
                  <p className="text-text-secondary text-sm">
                    Please respond by {new Date(request.response_deadline).toLocaleString()}
                  </p>
                  <p className="text-text-muted text-xs mt-1">
                    ({formatDistanceToNow(new Date(request.response_deadline), { addSuffix: true })})
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Beat Preview Card */}
          <div className="card mb-8">
            <div className="flex items-start space-x-4 mb-6">
              <img 
                src={beat.cover_art_url || '/placeholder-beat.jpg'} 
                alt={beat.title}
                className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white mb-1">{beat.title}</h2>
                {beat.type_beat && (
                  <p className="text-text-secondary mb-2">{beat.type_beat}</p>
                )}
                <div className="flex items-center space-x-4 text-text-muted text-sm">
                  {beat.bpm && <span>{beat.bpm} BPM</span>}
                  {beat.key && (
                    <>
                      <span>•</span>
                      <span>{beat.key}</span>
                    </>
                  )}
                  {beat.genre && (
                    <>
                      <span>•</span>
                      <span>{beat.genre}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Player */}
            <div className="bg-background-elevated rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={togglePlay}
                  disabled={!audioRef.current}
                  className="w-14 h-14 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-red-500/50 flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" fill="white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-1" fill="white" />
                  )}
                </button>

                <div className="flex-1 mx-4">
                  <div className="flex items-center space-x-3">
                    <Music className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div 
                        className="h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
                        onClick={handleSeek}
                      >
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-100"
                          style={{ 
                            width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-text-secondary text-sm min-w-[80px] text-right flex-shrink-0">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {volume > 0 ? (
                      <Volume2 className="w-5 h-5" />
                    ) : (
                      <VolumeX className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value) / 100)}
                    className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, rgb(239, 68, 68) 0%, rgb(239, 68, 68) ${volume * 100}%, rgb(55, 65, 81) ${volume * 100}%, rgb(55, 65, 81) 100%)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Response Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Love It */}
            <button
              onClick={() => handleResponse('approved')}
              disabled={processing}
              className="card hover:border-meckury-success hover:shadow-glow text-center p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-meckury-success bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-8 h-8 text-meckury-success" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">I Love It!</h3>
              <p className="text-text-secondary text-sm mb-3">
                Proceed to final payment
              </p>
              <div className="text-xs text-text-muted">
                <p>Lease: +₦10,000 (Total: ₦20,000)</p>
                <p>Exclusive: +₦70,000 (Total: ₦80,000)</p>
              </div>
            </button>

            {/* Request Revision */}
            {request.revision_count === 0 ? (
              <button
                onClick={() => handleResponse('revision')}
                disabled={processing}
                className="card hover:border-meckury-accent hover:shadow-glow text-center p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-16 h-16 bg-meckury-accent bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-meckury-accent" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Request Revision</h3>
                <p className="text-text-secondary text-sm">
                  One free revision available
                </p>
              </button>
            ) : (
              <div className="card bg-background-elevated text-center p-6 opacity-50">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-400 font-bold text-lg mb-2">Revision Used</h3>
                <p className="text-text-muted text-sm">
                  Maximum 1 revision per request
                </p>
              </div>
            )}

            {/* Pass */}
            <button
              onClick={() => handleResponse('pass')}
              disabled={processing}
              className="card hover:border-meckury-danger hover:shadow-glow text-center p-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 bg-meckury-danger bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsDown className="w-8 h-8 text-meckury-danger" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Pass</h3>
              <p className="text-text-secondary text-sm">
                {request.strike_count === 0 
                  ? 'Try a new beat (1 more chance)'
                  : 'Get full refund (final chance)'}
              </p>
            </button>
          </div>

          {/* Strike Counter */}
          <div className="card bg-meckury-secondary bg-opacity-10">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-meckury-secondary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-white font-semibold mb-2">
                  Attempts Remaining: {2 - (request.strike_count || 0)} of 2
                </p>
                <p className="text-text-secondary text-sm mb-2">
                  After 2 passes, you'll receive a full refund of ₦10,000
                </p>
                <div className="flex space-x-2 mt-3">
                  <div className={`h-2 flex-1 rounded-full ${request.strike_count >= 1 ? 'bg-meckury-danger' : 'bg-meckury-success'}`}></div>
                  <div className={`h-2 flex-1 rounded-full ${request.strike_count >= 2 ? 'bg-meckury-danger' : 'bg-gray-600'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Processing Overlay */}
          {processing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="card p-8 text-center">
                <div className="spinner w-12 h-12 mx-auto mb-4"></div>
                <p className="text-white font-semibold">Processing your response...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
