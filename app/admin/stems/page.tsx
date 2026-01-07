'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatDistanceToNow, addDays } from 'date-fns'

export default function AdminStemsPage() {
  const router = useRouter()
  const [stemsRequests, setStemsRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

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
    fetchStemsRequests()
  }

  const fetchStemsRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('stems_requests')
        .select(`
          *,
          beats (
            title,
            slug
          ),
          profiles:buyer_id (
            email,
            full_name
          ),
          purchases (
            payment_reference,
            amount
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStemsRequests(data || [])
    } catch (error) {
      console.error('Error fetching stems requests:', error)
      toast.error('Failed to load stems requests')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (requestId: string, file: File) => {
    if (!file) return

    // Check file size (max 200MB)
    if (file.size > 200 * 1024 * 1024) {
      toast.error('File too large. Max 200MB')
      return
    }

    // Check file type (should be ZIP)
    if (!file.name.endsWith('.zip')) {
      toast.error('Please upload a ZIP file')
      return
    }

    setUploading(requestId)

    try {
      // Upload to Supabase storage
      const fileExt = 'zip'
      const fileName = `${requestId}-${Date.now()}.${fileExt}`
      const filePath = `stems/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('stems')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get URL (private bucket, requires auth)
      const { data: { publicUrl } } = supabase.storage
        .from('stems')
        .getPublicUrl(filePath)

      // Update stems request
      const expiresAt = addDays(new Date(), 7) // 7 days from now

      const { error: updateError } = await supabase
        .from('stems_requests')
        .update({
          status: 'ready',
          file_url: publicUrl,
          uploaded_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      toast.success('Stems uploaded! Buyer will be notified.')
      fetchStemsRequests()
    } catch (error: any) {
      console.error('Error uploading stems:', error)
      toast.error(error.message || 'Failed to upload stems')
    } finally {
      setUploading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending_upload: {
        bg: 'bg-meckury-accent bg-opacity-20',
        text: 'text-meckury-accent',
        icon: <Clock className="w-4 h-4" />,
        label: 'Pending Upload',
      },
      ready: {
        bg: 'bg-meckury-success bg-opacity-20',
        text: 'text-meckury-success',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Ready',
      },
      downloaded: {
        bg: 'bg-meckury-secondary bg-opacity-20',
        text: 'text-meckury-secondary',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Downloaded',
      },
      expired: {
        bg: 'bg-meckury-danger bg-opacity-20',
        text: 'text-meckury-danger',
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Expired',
      },
    }

    const badge = badges[status as keyof typeof badges] || badges.pending_upload

    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
        {badge.icon}
        <span className="text-xs font-semibold">{badge.label}</span>
      </div>
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
              Stems Requests
            </h1>
            <p className="text-text-secondary text-lg">
              Upload stems for exclusive purchases
            </p>
          </div>

          {/* Info Banner */}
          <div className="card mb-8 bg-meckury-secondary bg-opacity-10 border border-meckury-secondary">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-meckury-secondary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-white font-semibold mb-1">
                  How Stems Delivery Works
                </h3>
                <ul className="text-text-secondary text-sm space-y-1">
                  <li>• Upload stems within 48 hours of exclusive purchase</li>
                  <li>• Upload as a ZIP file (max 200MB)</li>
                  <li>• Buyer gets notified when stems are ready</li>
                  <li>• Files auto-delete after 7 days</li>
                  <li>• Buyer can re-download within the 7-day window</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Stems Requests List */}
          {stemsRequests.length === 0 ? (
            <div className="card text-center py-12">
              <Upload className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No stems requests yet
              </h3>
              <p className="text-text-secondary">
                Exclusive purchase requests will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stemsRequests.map((request) => (
                <div key={request.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {request.beats?.title}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        Buyer: {request.profiles?.full_name || request.profiles?.email}
                      </p>
                      <p className="text-text-muted text-sm">
                        Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {/* Status-specific content */}
                  {request.status === 'pending_upload' && (
                    <div className="p-4 bg-background-elevated rounded-lg">
                      <p className="text-text-secondary text-sm mb-4">
                        ⏰ Upload stems within 48 hours of purchase to maintain service quality
                      </p>
                      <div className="flex items-center space-x-4">
                        <label className="btn-primary cursor-pointer flex items-center space-x-2">
                          <Upload className="w-5 h-5" />
                          <span>
                            {uploading === request.id ? 'Uploading...' : 'Upload Stems (ZIP)'}
                          </span>
                          <input
                            type="file"
                            accept=".zip"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(request.id, file)
                            }}
                            className="hidden"
                            disabled={uploading === request.id}
                          />
                        </label>
                        {uploading === request.id && (
                          <div className="spinner"></div>
                        )}
                      </div>
                    </div>
                  )}

                  {request.status === 'ready' && (
                    <div className="p-4 bg-meckury-success bg-opacity-10 border border-meckury-success rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-meckury-success font-semibold mb-1">
                            ✅ Stems Ready!
                          </p>
                          <p className="text-text-secondary text-sm">
                            Uploaded {formatDistanceToNow(new Date(request.uploaded_at!), { addSuffix: true })}
                            {' • '}
                            Expires {formatDistanceToNow(new Date(request.expires_at!), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-muted text-xs">
                            Downloads: {request.download_attempts || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.status === 'downloaded' && (
                    <div className="p-4 bg-meckury-secondary bg-opacity-10 border border-meckury-secondary rounded-lg">
                      <p className="text-meckury-secondary font-semibold">
                        ✅ Downloaded by buyer
                      </p>
                      <p className="text-text-secondary text-sm">
                        Downloaded {formatDistanceToNow(new Date(request.downloaded_at!), { addSuffix: true })}
                      </p>
                    </div>
                  )}

                  {request.status === 'expired' && (
                    <div className="p-4 bg-meckury-danger bg-opacity-10 border border-meckury-danger rounded-lg">
                      <p className="text-meckury-danger font-semibold">
                        ⚠️ Download window expired
                      </p>
                      <p className="text-text-secondary text-sm">
                        Files have been auto-deleted. Contact buyer if needed.
                      </p>
                    </div>
                  )}

                  {/* Purchase Info */}
                  <div className="mt-4 pt-4 border-t border-meckury-mediumGray grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted">Payment Reference</p>
                      <p className="text-white font-mono">
                        {request.purchases?.payment_reference}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted">Amount Paid</p>
                      <p className="text-white font-semibold">
                        ₦{request.purchases?.amount.toLocaleString()}
                      </p>
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
