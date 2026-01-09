'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Plus, Edit, Trash2, Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AdminBeatsPage() {
  const router = useRouter()
  const [beats, setBeats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
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
    fetchBeats()
  }

  const fetchBeats = async () => {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBeats(data || [])
    } catch (error) {
      console.error('Error fetching beats:', error)
      toast.error('Failed to load beats')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (beatId: string) => {
    if (!confirm('Are you sure you want to delete this beat?')) return

    try {
      const { error } = await supabase
        .from('beats')
        .delete()
        .eq('id', beatId)

      if (error) throw error

      toast.success('Beat deleted successfully')
      fetchBeats()
    } catch (error) {
      console.error('Error deleting beat:', error)
      toast.error('Failed to delete beat')
    }
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
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-5xl font-display font-bold text-white mb-2">
                Manage Beats
              </h1>
              <p className="text-text-secondary text-lg">
                Upload and manage your beat library
              </p>
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Upload Beat</span>
            </button>
          </div>

          {/* Beats List */}
          {beats.length === 0 ? (
            <div className="card text-center py-12">
              <Upload className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No beats uploaded yet
              </h3>
              <p className="text-text-secondary mb-6">
                Upload your first beat to get started
              </p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Upload Beat
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {beats.map((beat) => (
                <div key={beat.id} className="card">
                  <div className="flex items-start space-x-6">
                    {/* Cover Art */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-background-elevated">
                      {beat.cover_art_url ? (
                        <img
                          src={beat.cover_art_url}
                          alt={beat.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          🎵
                        </div>
                      )}
                    </div>

                    {/* Beat Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {beat.title}
                          </h3>
                          {beat.type_beat && (
                            <p className="text-text-secondary text-sm mb-2">
                              {beat.type_beat}
                            </p>
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

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <a
                            href={`/beats/${beat.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-text-secondary hover:text-meckury-primary transition-colors"
                            title="View"
                          >
                            <Eye className="w-5 h-5" />
                          </a>
                          <button
                            onClick={() => {
                              toast('Edit feature coming soon')
                            }}
                            className="p-2 text-text-secondary hover:text-meckury-accent transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(beat.id)}
                            className="p-2 text-text-secondary hover:text-meckury-danger transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-text-muted">Plays:</span>
                          <span className="text-white font-semibold ml-2">
                            {beat.play_count}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted">Leases:</span>
                          <span className="text-white font-semibold ml-2">
                            {beat.lease_count}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-muted">Status:</span>
                          <span
                            className={`ml-2 font-semibold ${
                              beat.exclusive_sold
                                ? 'text-meckury-accent'
                                : beat.active
                                ? 'text-meckury-success'
                                : 'text-text-muted'
                            }`}
                          >
                            {beat.exclusive_sold
                              ? 'Exclusive Sold'
                              : beat.active
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </div>
                        {beat.featured && (
                          <div>
                            <span className="badge badge-primary">Featured</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Form Modal - Placeholder */}
      {showUploadForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
          <div className="bg-background-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Upload Beat</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-text-muted hover:text-white transition-colors text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-meckury-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload Form Coming Soon
              </h3>
              <p className="text-text-secondary mb-6">
                For now, you can upload beats directly via Supabase dashboard:
              </p>
              <div className="text-left max-w-2xl mx-auto space-y-4 text-text-secondary text-sm">
                <p><strong className="text-white">1.</strong> Go to Supabase Dashboard → Storage</p>
                <p><strong className="text-white">2.</strong> Upload files to appropriate buckets:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Cover art → <code className="text-meckury-primary">beat-covers</code></li>
                  <li>MP3 file → <code className="text-meckury-primary">beat-audio</code></li>
                  <li>WAV file → <code className="text-meckury-primary">beat-audio</code></li>
                </ul>
                <p><strong className="text-white">3.</strong> Go to Table Editor → <code className="text-meckury-primary">beats</code> table</p>
                <p><strong className="text-white">4.</strong> Click "Insert row" and fill in:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>title, slug, cover_art_url, mp3_url, wav_url</li>
                  <li>bpm, key, genre, mood, type_beat</li>
                  <li>lease_price (₦20,000), exclusive_price (₦80,000)</li>
                  <li>active = true, featured = false</li>
                </ul>
              </div>
              <button
                onClick={() => setShowUploadForm(false)}
                className="btn-primary mt-8"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
