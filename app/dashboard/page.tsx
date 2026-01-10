'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, Music, Clock, CheckCircle, Upload, XCircle, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SongSubmissionForm from '@/components/SongSubmissionForm'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface BeatRequest {
  id: string
  created_at: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  linked_beat_id: string | null
  beats: {
    title: string
    slug: string
  } | null
}

// Raw type from Supabase query (beats comes as array)
interface BeatRequestRaw {
  id: string
  created_at: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'rejected'
  linked_beat_id: string | null
  beats: {
    title: string
    slug: string
  }[] | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [purchases, setPurchases] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [beatRequests, setBeatRequests] = useState<BeatRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [selectedBeat, setSelectedBeat] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }
    setUser(user)
    fetchPurchases(user.id)
    fetchSubmissions(user.id)
    fetchBeatRequests(user.id)
  }

  const fetchPurchases = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          beats (
            id,
            title,
            slug,
            cover_art_url,
            mp3_url,
            wav_url
          ),
          stems_requests (
            status,
            file_url,
            expires_at
          )
        `)
        .eq('user_id', userId)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPurchases(data || [])
    } catch (error) {
      console.error('Error fetching purchases:', error)
      toast.error('Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('song_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
  }

  const fetchBeatRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('beat_requests')
        .select(`
          id,
          created_at,
          title,
          description,
          status,
          linked_beat_id,
          beats!beat_requests_linked_beat_id_fkey (
            title,
            slug
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data to handle beats array -> single object
      const transformedData: BeatRequest[] = (data as BeatRequestRaw[])?.map(request => ({
        ...request,
        beats: request.beats && request.beats.length > 0 ? request.beats[0] : null
      })) || []
      
      setBeatRequests(transformedData)
    } catch (error) {
      console.error('Error fetching beat requests:', error)
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Download started')
    } catch (error) {
      toast.error('Download failed')
    }
  }

  const openSubmissionForm = (beat: any) => {
    setSelectedBeat(beat)
    setShowSubmissionForm(true)
  }

  const getSubmissionForBeat = (beatId: string) => {
    return submissions.find((sub) => sub.beat_id === beatId)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        bg: 'bg-meckury-accent bg-opacity-20',
        text: 'text-meckury-accent',
        icon: <Clock className="w-4 h-4" />,
        label: 'Pending Review',
      },
      in_progress: {
        bg: 'bg-blue-500 bg-opacity-20',
        text: 'text-blue-400',
        icon: <Music className="w-4 h-4" />,
        label: 'In Progress',
      },
      approved: {
        bg: 'bg-meckury-success bg-opacity-20',
        text: 'text-meckury-success',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Approved',
      },
      completed: {
        bg: 'bg-meckury-success bg-opacity-20',
        text: 'text-meckury-success',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Completed',
      },
      rejected: {
        bg: 'bg-meckury-danger bg-opacity-20',
        text: 'text-meckury-danger',
        icon: <XCircle className="w-4 h-4" />,
        label: 'Rejected',
      },
    }

    const badge = badges[status as keyof typeof badges] || badges.pending

    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
        {badge.icon}
        <span className="text-xs font-semibold">{badge.label}</span>
      </div>
    )
  }

  if (loading) {
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
            <h1 className="text-5xl font-display font-bold text-white mb-2">
              My Dashboard
            </h1>
            <p className="text-text-secondary text-lg">
              Manage your purchases, submissions, and beat requests
            </p>
          </div>

          {/* Beat Requests Section */}
          {beatRequests.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center space-x-2">
                <Sparkles className="w-8 h-8 text-meckury-primary" />
                <span>My Beat Requests ({beatRequests.length})</span>
              </h2>

              <div className="space-y-4">
                {beatRequests.map((request) => (
                  <div key={request.id} className="card">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {request.title}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <p className="text-text-secondary text-sm mb-3 line-clamp-2">
                          {request.description}
                        </p>

                        <p className="text-text-muted text-xs">
                          Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>

                        {/* Completed - Show linked beat */}
                        {request.status === 'completed' && request.linked_beat_id && request.beats && (
                          <div className="mt-4 p-4 bg-meckury-success bg-opacity-10 border border-meckury-success rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-meckury-success" />
                                <div>
                                  <p className="text-white font-semibold">
                                    Your beat is ready!
                                  </p>
                                  <p className="text-text-secondary text-sm">
                                    {request.beats.title}
                                  </p>
                                </div>
                              </div>
                              <Link
                                href={`/beats/${request.beats.slug}`}
                                className="btn-primary text-sm"
                              >
                                View & Purchase
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchases Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-6">
              My Purchases ({purchases.length})
            </h2>

            {purchases.length === 0 ? (
              <div className="card text-center py-12">
                <Music className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No purchases yet
                </h3>
                <p className="text-text-secondary mb-6">
                  Browse beats and make your first purchase
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/beats" className="btn-primary inline-flex items-center">
                    Browse Beats
                  </Link>
                  <Link href="/beats/request" className="btn-outline inline-flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Request Custom Beat</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {purchases.map((purchase) => {
                  const beat = purchase.beats
                  const stemsRequest = purchase.stems_requests?.[0]
                  const submission = getSubmissionForBeat(beat.id)

                  return (
                    <div key={purchase.id} className="card">
                      <div className="flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6">
                        {/* Beat Cover */}
                        <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-background-elevated">
                          {beat.cover_art_url ? (
                            <img
                              src={beat.cover_art_url}
                              alt={beat.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">
                              🎵
                            </div>
                          )}
                        </div>

                        {/* Beat Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-white mb-1">
                                {beat.title}
                              </h3>
                              <p className="text-text-secondary">
                                {purchase.license_type === 'lease' ? 'Lease License' : 'Exclusive Rights'}
                              </p>
                              <p className="text-text-muted text-sm mt-1">
                                Purchased {formatDistanceToNow(new Date(purchase.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>

                          {/* Downloads */}
                          <div className="space-y-3 mb-4">
                            <button
                              onClick={() => handleDownload(beat.mp3_url, `${beat.title}.mp3`)}
                              className="btn-outline w-full md:w-auto flex items-center justify-center space-x-2"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download MP3</span>
                            </button>

                            <button
                              onClick={() => handleDownload(beat.wav_url, `${beat.title}.wav`)}
                              className="btn-outline w-full md:w-auto flex items-center justify-center space-x-2 ml-0 md:ml-3"
                            >
                              <Download className="w-4 h-4" />
                              <span>Download WAV</span>
                            </button>

                            {/* Stems Download (Exclusive only) */}
                            {purchase.license_type === 'exclusive' && stemsRequest && (
                              <div className="mt-3 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
                                <h4 className="text-white font-semibold mb-2">Stems (Trackouts)</h4>
                                {stemsRequest.status === 'pending_upload' && (
                                  <p className="text-text-secondary text-sm">
                                    ⏳ Being prepared... You'll be notified when ready (within 48 hours)
                                  </p>
                                )}
                                {stemsRequest.status === 'ready' && stemsRequest.file_url && (
                                  <>
                                    <p className="text-meckury-success text-sm mb-2">
                                      ✅ Ready for download!
                                    </p>
                                    <button
                                      onClick={() => handleDownload(stemsRequest.file_url, `${beat.title}-stems.zip`)}
                                      className="btn-primary flex items-center space-x-2"
                                    >
                                      <Download className="w-4 h-4" />
                                      <span>Download Stems</span>
                                    </button>
                                    {stemsRequest.expires_at && (
                                      <p className="text-text-muted text-xs mt-2">
                                        Expires {formatDistanceToNow(new Date(stemsRequest.expires_at), { addSuffix: true })}
                                      </p>
                                    )}
                                  </>
                                )}
                                {stemsRequest.status === 'expired' && (
                                  <p className="text-meckury-danger text-sm">
                                    ❌ Download window expired. Contact support.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Song Submission */}
                          <div className="pt-4 border-t border-meckury-mediumGray">
                            {submission ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Music className="w-5 h-5 text-meckury-primary" />
                                  <div>
                                    <p className="text-white font-semibold">
                                      {submission.song_title}
                                    </p>
                                    <p className="text-text-muted text-sm">
                                      by {submission.artist_name}
                                    </p>
                                  </div>
                                </div>
                                {getStatusBadge(submission.status)}
                              </div>
                            ) : (
                              <button
                                onClick={() => openSubmissionForm(beat)}
                                className="flex items-center space-x-2 text-meckury-primary hover:text-meckury-accent transition-colors font-semibold"
                              >
                                <Upload className="w-5 h-5" />
                                <span>Made a song? Submit it for feature!</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission Form Modal */}
      {showSubmissionForm && selectedBeat && (
        <SongSubmissionForm
          beatId={selectedBeat.id}
          beatTitle={selectedBeat.title}
          onClose={() => {
            setShowSubmissionForm(false)
            setSelectedBeat(null)
          }}
          onSuccess={() => {
            fetchSubmissions(user.id)
          }}
        />
      )}

      <Footer />
    </div>
  )
}
