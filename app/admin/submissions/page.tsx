'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, Music } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EmbeddedPlayer from '@/components/EmbeddedPlayer'
import { supabase } from '@/lib/supabase'
import { getPlatformName } from '@/lib/platformUtils'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

export default function AdminSubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    checkAdmin()
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
    fetchSubmissions()
  }

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('song_submissions')
        .select(`
          *,
          beats (
            title,
            slug
          ),
          profiles (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast.error('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('song_submissions')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          admin_notes: adminNotes || null,
        })
        .eq('id', submissionId)

      if (error) throw error

      toast.success('Song approved and published!')
      setSelectedSubmission(null)
      setAdminNotes('')
      fetchSubmissions()
    } catch (error) {
      console.error('Error approving submission:', error)
      toast.error('Failed to approve submission')
    }
  }

  const handleReject = async (submissionId: string) => {
    if (!adminNotes) {
      toast.error('Please provide a reason for rejection')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('song_submissions')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          approved_by: user?.id,
        })
        .eq('id', submissionId)

      if (error) throw error

      toast.success('Song rejected')
      setSelectedSubmission(null)
      setAdminNotes('')
      fetchSubmissions()
    } catch (error) {
      console.error('Error rejecting submission:', error)
      toast.error('Failed to reject submission')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: {
        bg: 'bg-meckury-accent bg-opacity-20',
        text: 'text-meckury-accent',
        label: 'Pending',
      },
      approved: {
        bg: 'bg-meckury-success bg-opacity-20',
        text: 'text-meckury-success',
        label: 'Approved',
      },
      rejected: {
        bg: 'bg-meckury-danger bg-opacity-20',
        text: 'text-meckury-danger',
        label: 'Rejected',
      },
    }

    const badge = badges[status as keyof typeof badges] || badges.pending

    return (
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

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
            <h1 className="text-5xl font-display font-bold text-white mb-2">
              Song Submissions
            </h1>
            <p className="text-text-secondary text-lg">
              Review and approve user submissions
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-4 mb-8">
            <button className="btn-primary">
              All ({submissions.length})
            </button>
            <button className="btn-ghost">
              Pending ({submissions.filter(s => s.status === 'pending').length})
            </button>
            <button className="btn-ghost">
              Approved ({submissions.filter(s => s.status === 'approved').length})
            </button>
            <button className="btn-ghost">
              Rejected ({submissions.filter(s => s.status === 'rejected').length})
            </button>
          </div>

          {/* Submissions List */}
          {submissions.length === 0 ? (
            <div className="card text-center py-12">
              <Music className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No submissions yet
              </h3>
              <p className="text-text-secondary">
                Song submissions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="card">
                  <div className="flex items-start space-x-6">
                    {/* Cover Art */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-background-elevated">
                      {submission.cover_art_url ? (
                        <img
                          src={submission.cover_art_url}
                          alt={submission.song_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          🎵
                        </div>
                      )}
                    </div>

                    {/* Submission Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {submission.song_title}
                          </h3>
                          <p className="text-text-secondary text-sm">
                            by {submission.artist_name}
                          </p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>

                      <div className="flex items-center space-x-4 text-text-muted text-sm mb-3">
                        <span>Platform: {getPlatformName(submission.platform)}</span>
                        <span>•</span>
                        <span>Beat: {submission.beats?.title}</span>
                        <span>•</span>
                        <span>Submitted {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}</span>
                      </div>

                      {submission.admin_notes && (
                        <div className="p-3 bg-background-elevated rounded-lg mb-3">
                          <p className="text-text-secondary text-sm">
                            <strong>Notes:</strong> {submission.admin_notes}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="btn-outline flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Review</span>
                        </button>

                        {submission.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedSubmission(submission)
                              }}
                              className="btn-primary flex items-center space-x-2 bg-meckury-success hover:bg-opacity-90"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSubmission(submission)
                              }}
                              className="btn-outline border-meckury-danger text-meckury-danger hover:bg-meckury-danger hover:text-white flex items-center space-x-2"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        <a
                          href={submission.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-meckury-primary hover:text-meckury-accent text-sm font-semibold"
                        >
                          View on {getPlatformName(submission.platform)} →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="bg-background-card rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedSubmission.song_title}
                  </h2>
                  <p className="text-text-secondary text-lg">
                    by {selectedSubmission.artist_name}
                  </p>
                  <p className="text-text-muted text-sm mt-2">
                    Beat: {selectedSubmission.beats?.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSubmission(null)
                    setAdminNotes('')
                  }}
                  className="text-text-muted hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Embedded Player */}
              <div className="mb-6">
                <EmbeddedPlayer
                  platform={selectedSubmission.platform}
                  embedUrl={selectedSubmission.embed_url}
                  externalUrl={selectedSubmission.external_url}
                  title={selectedSubmission.song_title}
                  artist={selectedSubmission.artist_name}
                />
              </div>

              {/* Admin Notes */}
              {selectedSubmission.status === 'pending' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Admin Notes (optional for approval, required for rejection)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="textarea h-24"
                    placeholder="Add notes about this submission..."
                  />
                </div>
              )}

              {/* Actions */}
              {selectedSubmission.status === 'pending' && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleApprove(selectedSubmission.id)}
                    className="btn-primary flex-1 flex items-center justify-center space-x-2 bg-meckury-success hover:bg-opacity-90"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Approve & Publish</span>
                  </button>
                  <button
                    onClick={() => handleReject(selectedSubmission.id)}
                    className="btn-outline flex-1 border-meckury-danger text-meckury-danger hover:bg-meckury-danger hover:text-white flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
