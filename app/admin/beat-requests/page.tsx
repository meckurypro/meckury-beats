'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Clock,
  CheckCircle,
  XCircle,
  Music,
  Link as LinkIcon,
  Mic,
  Play,
  Pause,
  User,
  Calendar,
  Edit,
  Eye,
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
    email: string
    full_name: string | null
  }
  beats: {
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
    email: string
    full_name: string | null
  }[]
  beats: {
    title: string
    slug: string
  }[] | null
}

export default function AdminBeatRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<BeatRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'>('all')
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Map<string, HTMLAudioElement>>(new Map())

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchRequests()
    }
  }, [isAdmin])

  // Cleanup all audio elements on unmount
  useEffect(() => {
    return () => {
      audioElements.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
      setAudioElements(new Map())
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
  }

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('beat_requests')
        .select(`
          *,
          profiles!beat_requests_user_id_fkey (
            email,
            full_name
          ),
          beats!beat_requests_linked_beat_id_fkey (
            title,
            slug
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data to handle arrays -> single objects
      const transformedData: BeatRequest[] = (data as BeatRequestRaw[])?.map(request => ({
        ...request,
        profiles: request.profiles && request.profiles.length > 0 ? request.profiles[0] : { email: '', full_name: null },
        beats: request.beats && request.beats.length > 0 ? request.beats[0] : null
      })) || []
      
      setRequests(transformedData)
    } catch (error) {
      console.error('Error fetching beat requests:', error)
      toast.error('Failed to load beat requests')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: BeatRequest['status']) => {
    try {
      const { error } = await supabase
        .from('beat_requests')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      
      toast.success(`Status updated to ${status}`)
      fetchRequests()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const toggleAudio = (url: string) => {
    // If already playing this audio, pause it
    if (playingAudio === url) {
      const audio = audioElements.get(url)
      if (audio) {
        audio.pause()
      }
      setPlayingAudio(null)
      return
    }

    // Pause any currently playing audio
    if (playingAudio) {
      const currentAudio = audioElements.get(playingAudio)
      if (currentAudio) {
        currentAudio.pause()
      }
    }

    // Get or create audio element for this URL
    let audio = audioElements.get(url)
    if (!audio) {
      audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.preload = 'metadata'
      audio.src = url
      
      // Event handlers
      audio.onended = () => {
        setPlayingAudio(null)
      }
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        toast.error('Failed to play audio. The file may be corrupted or in an unsupported format.')
        setPlayingAudio(null)
      }

      // Store the audio element
      const newMap = new Map(audioElements)
      newMap.set(url, audio)
      setAudioElements(newMap)
    }

    // Play the audio
    audio.play()
      .then(() => {
        setPlayingAudio(url)
      })
      .catch((error) => {
        console.error('Playback failed:', error)
        toast.error('Failed to play audio')
      })
  }

  const getStatusBadge = (status: BeatRequest['status']) => {
    const badges = {
      pending: {
        bg: 'bg-meckury-accent bg-opacity-20',
        text: 'text-meckury-accent',
        icon: <Clock className="w-4 h-4" />,
      },
      in_progress: {
        bg: 'bg-blue-500 bg-opacity-20',
        text: 'text-blue-400',
        icon: <Music className="w-4 h-4" />,
      },
      completed: {
        bg: 'bg-meckury-success bg-opacity-20',
        text: 'text-meckury-success',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      rejected: {
        bg: 'bg-meckury-danger bg-opacity-20',
        text: 'text-meckury-danger',
        icon: <XCircle className="w-4 h-4" />,
      },
    }

    const badge = badges[status]

    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
        {badge.icon}
        <span className="text-xs font-semibold capitalize">{status.replace('_', ' ')}</span>
      </div>
    )
  }

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter((req) => req.status === filter)

  if (!isAdmin || loading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-5xl font-display font-bold text-white mb-2">
                  Beat Requests
                </h1>
                <p className="text-text-secondary text-lg">
                  Manage custom beat requests from clients
                </p>
              </div>
              <Link href="/admin" className="btn-outline">
                ← Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-3">
            {(['all', 'pending', 'in_progress', 'completed', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === status
                    ? 'bg-meckury-primary text-white'
                    : 'bg-background-card text-text-secondary hover:text-white'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                <span className="ml-2 text-xs">
                  ({status === 'all' ? requests.length : requests.filter((r) => r.status === status).length})
                </span>
              </button>
            ))}
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="card text-center py-12">
              <Music className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No requests found
              </h3>
              <p className="text-text-secondary">
                {filter === 'all' 
                  ? 'No beat requests yet' 
                  : `No ${filter.replace('_', ' ')} requests`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredRequests.map((request) => (
                <div key={request.id} className="card">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-2xl font-bold text-white">
                            {request.title}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4" />
                            <span>
                              {request.profiles.full_name || request.profiles.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/admin/beat-requests/${request.id}`}
                        className="btn-outline flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </Link>
                    </div>

                    {/* Description */}
                    <div className="bg-background-elevated rounded-lg p-4">
                      <p className="text-text-secondary whitespace-pre-wrap line-clamp-3">
                        {request.description}
                      </p>
                    </div>

                    {/* Reference URLs */}
                    {request.reference_urls && request.reference_urls.length > 0 && (
                      <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
                          <LinkIcon className="w-4 h-4" />
                          <span>Reference Tracks ({request.reference_urls.length})</span>
                        </h4>
                        <div className="space-y-2">
                          {request.reference_urls.slice(0, 2).map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-meckury-primary hover:text-meckury-accent text-sm truncate"
                            >
                              {url}
                            </a>
                          ))}
                          {request.reference_urls.length > 2 && (
                            <p className="text-text-muted text-sm">
                              +{request.reference_urls.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Voice Note */}
                    {request.voice_note_url && (
                      <div className="bg-background-elevated rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-3 flex items-center space-x-2">
                          <Mic className="w-4 h-4" />
                          <span>Voice Note</span>
                        </h4>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleAudio(request.voice_note_url!)}
                            className="btn-primary flex items-center space-x-2"
                          >
                            {playingAudio === request.voice_note_url ? (
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
                          
                          {/* Native HTML5 audio as fallback */}
                          <audio
                            controls
                            preload="metadata"
                            className="flex-1 h-10"
                            crossOrigin="anonymous"
                          >
                            <source src={request.voice_note_url} type="audio/webm" />
                            <source src={request.voice_note_url} type="audio/mpeg" />
                            Your browser does not support audio playback.
                          </audio>
                        </div>
                      </div>
                    )}

                    {/* Linked Beat */}
                    {request.linked_beat_id && request.beats && (
                      <div className="bg-meckury-success bg-opacity-10 border border-meckury-success rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="w-5 h-5 text-meckury-success" />
                            <div>
                              <p className="text-white font-semibold">
                                Linked to Beat
                              </p>
                              <p className="text-text-secondary text-sm">
                                {request.beats.title}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/beats/${request.beats.slug}`}
                            className="btn-outline text-sm"
                          >
                            View Beat
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-meckury-mediumGray">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(request.id, 'in_progress')}
                            className="btn-primary flex items-center space-x-2"
                          >
                            <Music className="w-4 h-4" />
                            <span>Start Working</span>
                          </button>
                          <button
                            onClick={() => updateStatus(request.id, 'rejected')}
                            className="btn-outline text-meckury-danger hover:bg-meckury-danger hover:bg-opacity-10 flex items-center space-x-2"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                      
                      {request.status === 'in_progress' && (
                        <Link
                          href={`/admin/beat-requests/${request.id}`}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Link Beat & Complete</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
