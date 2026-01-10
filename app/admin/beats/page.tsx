// app/admin/beats/page.tsx - Updated with Edit & Audit Log
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Eye, RefreshCw, Music, TrendingUp, History } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BeatUploadForm from '@/components/BeatUploadForm'
import BeatEditForm from '@/components/BeatEditForm'
import BeatAuditLog from '@/components/BeatAuditLog'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AdminBeatsPage() {
  const router = useRouter()
  const [beats, setBeats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [editingBeat, setEditingBeat] = useState<any | null>(null)
  const [auditLogBeat, setAuditLogBeat] = useState<any | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'sold'>('all')

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
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchBeats()
  }

  const handleDelete = async (beatId: string, beatTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${beatTitle}"? This action cannot be undone.`)) return

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

  const toggleActive = async (beatId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('beats')
        .update({ active: !currentStatus })
        .eq('id', beatId)

      if (error) throw error

      toast.success(`Beat ${currentStatus ? 'deactivated' : 'activated'}`)
      fetchBeats()
    } catch (error) {
      console.error('Error toggling beat status:', error)
      toast.error('Failed to update beat')
    }
  }

  const toggleFeatured = async (beatId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('beats')
        .update({ featured: !currentStatus })
        .eq('id', beatId)

      if (error) throw error

      toast.success(`Beat ${currentStatus ? 'removed from' : 'added to'} featured`)
      fetchBeats()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update beat')
    }
  }

  const filteredBeats = beats.filter(beat => {
    if (filter === 'active') return beat.active
    if (filter === 'inactive') return !beat.active
    if (filter === 'sold') return beat.exclusive_sold
    return true
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price)
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
            <div>
              <h1 className="text-5xl font-display font-bold text-white mb-2">
                Manage Beats
              </h1>
              <p className="text-text-secondary text-lg">
                Upload, edit, and manage your beat library
              </p>
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="btn-primary flex items-center justify-center space-x-2 sm:w-auto w-full"
            >
              <Plus className="w-5 h-5" />
              <span>Upload New Beat</span>
            </button>
          </div>

          {/* Stats & Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div 
              className={`card cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-meckury-primary' : ''}`}
              onClick={() => setFilter('all')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Beats</p>
                  <p className="text-3xl font-bold text-white">{beats.length}</p>
                </div>
                <Music className="w-8 h-8 text-meckury-primary" />
              </div>
            </div>

            <div 
              className={`card cursor-pointer transition-all ${filter === 'active' ? 'ring-2 ring-meckury-success' : ''}`}
              onClick={() => setFilter('active')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Active</p>
                  <p className="text-3xl font-bold text-white">
                    {beats.filter(b => b.active).length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-meckury-success bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="w-3 h-3 bg-meckury-success rounded-full"></span>
                </div>
              </div>
            </div>

            <div 
              className={`card cursor-pointer transition-all ${filter === 'sold' ? 'ring-2 ring-meckury-accent' : ''}`}
              onClick={() => setFilter('sold')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Exclusive Sold</p>
                  <p className="text-3xl font-bold text-white">
                    {beats.filter(b => b.exclusive_sold).length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-meckury-accent bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-meckury-accent font-bold">₦</span>
                </div>
              </div>
            </div>

            <div 
              className={`card cursor-pointer transition-all ${filter === 'inactive' ? 'ring-2 ring-meckury-danger' : ''}`}
              onClick={() => setFilter('inactive')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Inactive</p>
                  <p className="text-3xl font-bold text-white">
                    {beats.filter(b => !b.active).length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-meckury-danger bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="w-3 h-3 bg-meckury-danger rounded-full"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex items-center space-x-2 text-text-secondary">
              <span>Showing {filteredBeats.length} beats</span>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="text-meckury-primary hover:text-meckury-accent text-sm"
                >
                  Clear filter
                </button>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-outline flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* Beats List */}
          {filteredBeats.length === 0 ? (
            <div className="card text-center py-12">
              <Music className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {filter === 'all' ? 'No beats uploaded yet' : 'No beats found'}
              </h3>
              <p className="text-text-secondary mb-6">
                {filter === 'all' 
                  ? 'Upload your first beat to get started'
                  : `No ${filter} beats found. Try a different filter.`
                }
              </p>
              {filter === 'all' ? (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="btn-primary inline-flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Upload First Beat
                </button>
              ) : (
                <button
                  onClick={() => setFilter('all')}
                  className="btn-primary"
                >
                  View All Beats
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBeats.map((beat) => (
                <div key={beat.id} className="card hover:shadow-glow transition-all">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Cover Art & Quick Actions */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-lg overflow-hidden bg-background-elevated relative group">
                        <img
                          src={beat.cover_art_url}
                          alt={beat.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <a
                            href={`/beats/${beat.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-meckury-primary rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all"
                            title="View on site"
                          >
                            <Eye className="w-5 h-5 text-white" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Beat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl font-bold text-white mb-1 truncate">
                            {beat.title}
                          </h3>
                          {beat.type_beat && (
                            <p className="text-text-secondary text-sm mb-2">
                              {beat.type_beat}
                            </p>
                          )}
                          {beat.collaborators && (
                            <p className="text-text-muted text-sm mb-2">
                              <span className="text-meckury-primary">Collaborators:</span> {beat.collaborators}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 text-text-muted text-sm mb-3">
                            {beat.bpm && (
                              <span className="px-2 py-1 bg-background-elevated rounded">
                                {beat.bpm} BPM
                              </span>
                            )}
                            {beat.key && (
                              <span className="px-2 py-1 bg-background-elevated rounded">
                                {beat.key}
                              </span>
                            )}
                            {beat.genre && (
                              <span className="px-2 py-1 bg-background-elevated rounded">
                                {beat.genre}
                              </span>
                            )}
                            {beat.mood && (
                              <span className="px-2 py-1 bg-background-elevated rounded">
                                {beat.mood}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleActive(beat.id, beat.active)}
                            className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                              beat.active
                                ? 'bg-meckury-success bg-opacity-20 text-meckury-success hover:bg-opacity-30'
                                : 'bg-meckury-danger bg-opacity-20 text-meckury-danger hover:bg-opacity-30'
                            }`}
                          >
                            {beat.active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => toggleFeatured(beat.id, beat.featured)}
                            className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                              beat.featured
                                ? 'bg-meckury-primary bg-opacity-20 text-meckury-primary hover:bg-opacity-30'
                                : 'bg-meckury-mediumGray text-text-secondary hover:bg-opacity-30'
                            }`}
                          >
                            {beat.featured ? 'Featured' : 'Feature'}
                          </button>
                        </div>
                      </div>

                      {/* Stats & Pricing */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-background-elevated rounded-lg">
                          <p className="text-text-muted text-xs mb-1">Plays</p>
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 text-meckury-primary mr-2" />
                            <p className="text-white font-bold text-lg">{beat.play_count || 0}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-background-elevated rounded-lg">
                          <p className="text-text-muted text-xs mb-1">Leases Sold</p>
                          <p className="text-white font-bold text-lg">{beat.lease_count || 0}</p>
                        </div>
                        <div className="p-3 bg-background-elevated rounded-lg">
                          <p className="text-text-muted text-xs mb-1">Pricing</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-meckury-primary font-bold">
                              {formatPrice(beat.lease_price)}
                            </p>
                            {!beat.exclusive_sold && (
                              <p className="text-meckury-accent font-bold">
                                {formatPrice(beat.exclusive_price)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Detailed Actions */}
                      <div className="flex flex-wrap items-center justify-between pt-4 border-t border-meckury-mediumGray gap-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            beat.exclusive_sold
                              ? 'bg-meckury-accent bg-opacity-20 text-meckury-accent'
                              : 'bg-meckury-success bg-opacity-20 text-meckury-success'
                          }`}>
                            {beat.exclusive_sold ? 'Exclusive Sold' : 'Exclusive Available'}
                          </span>
                          <span className="text-text-muted text-sm">
                            Created {new Date(beat.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setAuditLogBeat(beat)}
                            className="btn-outline flex items-center space-x-1 px-3 py-1.5 text-sm"
                            title="View edit history"
                          >
                            <History className="w-4 h-4" />
                            <span>History</span>
                          </button>
                          <button
                            onClick={() => setEditingBeat(beat)}
                            className="btn-outline flex items-center space-x-1 px-3 py-1.5 text-sm"
                            title="Edit beat"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(beat.id, beat.title)}
                            className="btn-outline border-meckury-danger text-meckury-danger hover:bg-meckury-danger hover:text-white flex items-center space-x-1 px-3 py-1.5 text-sm"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <BeatUploadForm
          onClose={() => setShowUploadForm(false)}
          onSuccess={() => {
            fetchBeats()
            toast.success('Beat uploaded successfully!')
          }}
        />
      )}

      {/* Edit Form */}
      {editingBeat && (
        <BeatEditForm
          beat={editingBeat}
          onClose={() => setEditingBeat(null)}
          onSuccess={() => {
            fetchBeats()
            setEditingBeat(null)
          }}
        />
      )}

      {/* Audit Log */}
      {auditLogBeat && (
        <BeatAuditLog
          beatId={auditLogBeat.id}
          beatTitle={auditLogBeat.title}
          onClose={() => setAuditLogBeat(null)}
        />
      )}

      <Footer />
    </div>
  )
}
