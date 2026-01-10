'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Music,
  Link as LinkIcon,
  Mic,
  Play,
  Pause,
  User,
  Calendar,
  CheckCircle,
  Save,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface BeatRequest {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string
  description: string
  reference_urls: string[]
  voice_note_url: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  admin_notes: string | null
  linked_beat_id: string | null
  completed_at: string | null
  completed_by: string | null
  profiles: {
    id: string
    email: string
    full_name: string | null
  }
  beats: {
    id: string
    title: string
    slug: string
  } | null
}

// Raw type from Supabase query
interface BeatRequestRaw {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  title: string
  description: string
  reference_urls: string[]
  voice_note_url: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  admin_notes: string | null
  linked_beat_id: string | null
  completed_at: string | null
  completed_by: string | null
  profiles: {
    id: string
    email: string
    full_name: string | null
  }[]
  beats: {
    id: string
    title: string
    slug: string
  }[] | null
}

interface Beat {
  id: string
  title: string
  slug: string
  bpm: number | null
  key: string | null
  genre: string | null
}

export default function BeatRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [request, setRequest] = useState<BeatRequest | null>(null)
  const [beats, setBeats] = useState<Beat[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)

  const [selectedBeatId, setSelectedBeatId] = useState<string>('')
  const [adminNotes, setAdminNotes] = useState('')
  const [status, setStatus] = useState<BeatRequest['status']>('pending')

  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchRequest()
      fetchBeats()
    }
  }, [isAdmin, requestId])

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!data?.is_admin) {
      toast.error('Access denied')
      router.push('/')
      return
    }

    setIsAdmin(true)
    setAdminUser(user)
  }

  const fetchRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('beat_requests')
        .select(`
          *,
          profiles!beat_requests_user_id_fkey (
            id,
            email,
            full_name
          ),
          beats!beat_requests_linked_beat_id_fkey (
            id,
            title,
            slug
          )
        `)
        .eq('id', requestId)
        .single()

      if (error) throw error
      
      // Transform the data to handle arrays -> single objects
      const rawData = data as BeatRequestRaw
      const transformedData: BeatRequest = {
        ...rawData,
        profiles: rawData.profiles && rawData.profiles.length > 0 
          ? rawData.profiles[0] 
          : { id: '', email: '', full_name: null },
        beats: rawData.beats && rawData.beats.length > 0 ? rawData.beats[0] : null
      }
      
      setRequest(transformedData)
      setSelectedBeatId(transformedData.linked_beat_id || '')
      setAdminNotes(transformedData.admin_notes || '')
      setStatus(transformedData.status)
    } catch (error) {
      console.error('Error fetching request:', error)
      toast.error('Failed to load request')
      router.push('/admin/beat-requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchBeats = async () => {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select('id, title, slug, bpm, key, genre')
        .eq('active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBeats(data || [])
    } catch (error) {
      console.error('Error fetching beats:', error)
    }
  }

  const handleSave = async () => {
    if (!adminUser) return

    setSaving(true)

    try {
      const updateData: any = {
        admin_notes: adminNotes.trim() || null,
        status,
      }

      // If marking as completed, add completion metadata
      if (status === 'completed' && selectedBeatId) {
        updateData.linked_beat_id = selectedBeatId
        updateData.completed_at = new Date().toISOString()
        updateData.completed_by = adminUser.id
      }

      const { error } = await supabase
        .from('beat_requests')
        .update(updateData)
        .eq('id', requestId)

      if (error) throw error

      toast.success('Request updated successfully!')
      router.push('/admin/beat-requests')
    } catch (error) {
      console.error('Error updating request:', error)
      toast.error('Failed to update request')
    } finally {
      setSaving(false)
    }
  }

  const toggleAudio = () => {
    if (!request?.voice_note_url) return

    if (!audioRef.current) {
      // Create new audio element
      const audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.preload = 'metadata'
      audio.src = request.voice_note_url
      
      audio.onended = () => {
        setIsPlaying(false)
      }
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        toast.error('Failed to play audio. The file may be corrupted or in an unsupported format.')
        setIsPlaying(false)
      }
      
      audioRef.current = audio
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          console.error('Playback failed:', error)
          toast.error('Failed to play audio')
        })
    }
  }

  if (!isAdmin || loading || !request) {
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin/beat-requests"
              className="inline-flex items-center space-x-2 text-meckury-primary hover:text-meckury-accent mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Requests</span>
            </Link>
            
            <h1 className="text-4xl font-display font-bold text-white mb-2">
              {request.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>{request.profiles.full_name || request.profiles.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Request Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="card">
                <h3 className="text-xl font-semibold text-white mb-3">
                  Description
                </h3>
                <p className="text-text-secondary whitespace-pre-wrap">
                  {request.description}
                </p>
              </div>

              {/* Reference URLs */}
              {request.reference_urls && request.reference_urls.length > 0 && (
                <div className="card">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5" />
                    <span>Reference Tracks</span>
                  </h3>
                  <div className="space-y-3">
                    {request.reference_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-background-elevated rounded-lg hover:bg-opacity-80 transition-all"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-meckury-primary bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-meckury-primary font-semibold text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-meckury-primary hover:text-meckury-accent truncate">
                            {url}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Note */}
              {request.voice_note_url && (
                <div className="card">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center space-x-2">
                    <Mic className="w-5 h-5" />
                    <span>Voice Note</span>
                  </h3>
                  <div className="bg-background-elevated rounded-lg p-4 space-y-4">
                    {/* Custom Player */}
                    <button
                      onClick={toggleAudio}
                      className="btn-primary flex items-center space-x-2"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-5 h-5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          <span>Play Voice Note</span>
                        </>
                      )}
                    </button>
                    
                    {/* Native HTML5 audio as fallback/alternative */}
                    <div className="pt-4 border-t border-meckury-mediumGray">
                      <p className="text-text-muted text-xs mb-2">Or use browser player:</p>
                      <audio
                        controls
                        preload="metadata"
                        className="w-full"
                        crossOrigin="anonymous"
                      >
                        <source src={request.voice_note_url} type="audio/webm" />
                        <source src={request.voice_note_url} type="audio/mpeg" />
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Admin Actions */}
            <div className="space-y-6">
              {/* Status */}
              <div className="card">
                <label className="block text-white font-semibold mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BeatRequest['status'])}
                  className="input w-full"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Link Beat (only if completing) */}
              {status === 'completed' && (
                <div className="card">
                  <label className="block text-white font-semibold mb-2">
                    Link Beat *
                  </label>
                  <select
                    value={selectedBeatId}
                    onChange={(e) => setSelectedBeatId(e.target.value)}
                    className="input w-full"
                    required
                  >
                    <option value="">Select a beat...</option>
                    {beats.map((beat) => (
                      <option key={beat.id} value={beat.id}>
                        {beat.title}
                        {beat.bpm && beat.key ? ` (${beat.bpm} BPM, ${beat.key})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-text-muted text-sm mt-2">
                    Select the beat you created for this request
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              <div className="card">
                <label className="block text-white font-semibold mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this request..."
                  className="input w-full min-h-[120px] resize-y"
                  maxLength={1000}
                />
                <p className="text-text-muted text-sm mt-2">
                  {adminNotes.length}/1000 characters
                </p>
              </div>

              {/* Current Linked Beat */}
              {request.linked_beat_id && request.beats && (
                <div className="card bg-meckury-success bg-opacity-10 border border-meckury-success">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-meckury-success flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-white font-semibold mb-1">
                        Currently Linked Beat
                      </p>
                      <p className="text-text-secondary text-sm mb-3">
                        {request.beats.title}
                      </p>
                      <Link
                        href={`/beats/${request.beats.slug}`}
                        target="_blank"
                        className="text-meckury-primary hover:text-meckury-accent text-sm font-semibold"
                      >
                        View Beat →
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving || (status === 'completed' && !selectedBeatId)}
                className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="spinner w-5 h-5"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>

              {status === 'completed' && !selectedBeatId && (
                <p className="text-meckury-danger text-sm text-center">
                  Please select a beat to mark as completed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
