'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Music,
  ShoppingCart,
  Upload,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Sparkles,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalBeats: 0,
    activeBeats: 0,
    exclusiveSold: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    pendingSubmissions: 0,
    pendingStemsRequests: 0,
    pendingBeatRequests: 0,
  })
  const [loading, setLoading] = useState(true)
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
    fetchStats()
  }

  const fetchStats = async () => {
    try {
      // Fetch beats stats
      const { data: beatsData } = await supabase
        .from('beats')
        .select('*')

      // Fetch purchases stats
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('*')
        .eq('payment_status', 'completed')

      // Fetch pending submissions
      const { data: submissionsData } = await supabase
        .from('song_submissions')
        .select('*')
        .eq('status', 'pending')

      // Fetch pending stems requests
      const { data: stemsData } = await supabase
        .from('stems_requests')
        .select('*')
        .eq('status', 'pending_upload')

      // Fetch pending beat requests
      const { data: beatRequestsData } = await supabase
        .from('beat_requests')
        .select('*')
        .eq('status', 'pending')

      // Calculate stats
      const totalBeats = beatsData?.length || 0
      const activeBeats = beatsData?.filter((b) => b.active)?.length || 0
      const exclusiveSold = beatsData?.filter((b) => b.exclusive_sold)?.length || 0
      const totalPurchases = purchasesData?.length || 0
      const totalRevenue = purchasesData?.reduce((sum, p) => sum + p.amount, 0) || 0
      const pendingSubmissions = submissionsData?.length || 0
      const pendingStemsRequests = stemsData?.length || 0
      const pendingBeatRequests = beatRequestsData?.length || 0

      setStats({
        totalBeats,
        activeBeats,
        exclusiveSold,
        totalPurchases,
        totalRevenue,
        pendingSubmissions,
        pendingStemsRequests,
        pendingBeatRequests,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast.error('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

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
          <div className="mb-12">
            <h1 className="text-5xl font-display font-bold text-white mb-2">
              Admin Dashboard
            </h1>
            <p className="text-text-secondary text-lg">
              Manage your beat store
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Beats */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-text-secondary text-sm">Total Beats</p>
                  <p className="text-3xl font-bold text-white">{stats.totalBeats}</p>
                </div>
                <div className="w-12 h-12 bg-meckury-primary bg-opacity-10 rounded-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-meckury-primary" />
                </div>
              </div>
              <p className="text-text-muted text-sm">
                {stats.activeBeats} active • {stats.exclusiveSold} exclusive sold
              </p>
            </div>

            {/* Total Revenue */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-text-secondary text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold text-white">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-meckury-success bg-opacity-10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-meckury-success" />
                </div>
              </div>
              <p className="text-text-muted text-sm">
                From {stats.totalPurchases} purchases
              </p>
            </div>

            {/* Pending Submissions */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-text-secondary text-sm">Pending Songs</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.pendingSubmissions}
                  </p>
                </div>
                <div className="w-12 h-12 bg-meckury-accent bg-opacity-10 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-meckury-accent" />
                </div>
              </div>
              <Link
                href="/admin/submissions"
                className="text-meckury-primary hover:text-meckury-accent text-sm font-semibold"
              >
                Review submissions →
              </Link>
            </div>

            {/* Pending Stems */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-text-secondary text-sm">Pending Stems</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.pendingStemsRequests}
                  </p>
                </div>
                <div className="w-12 h-12 bg-meckury-secondary bg-opacity-10 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-meckury-secondary" />
                </div>
              </div>
              <Link
                href="/admin/stems"
                className="text-meckury-primary hover:text-meckury-accent text-sm font-semibold"
              >
                Upload stems →
              </Link>
            </div>
          </div>

          {/* Beat Requests Alert (if any pending) */}
          {stats.pendingBeatRequests > 0 && (
            <div className="card bg-meckury-primary bg-opacity-10 border border-meckury-primary mb-12">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-meckury-primary bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-meckury-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {stats.pendingBeatRequests} New Beat Request{stats.pendingBeatRequests !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Clients are waiting for custom beats. Review and start creating!
                  </p>
                  <Link
                    href="/admin/beat-requests"
                    className="btn-primary inline-flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>View Beat Requests</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/beats" className="card hover:shadow-glow transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-meckury-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-meckury-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Manage Beats
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Upload, edit, and delete beats
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/admin/beat-requests" className="card hover:shadow-glow transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-meckury-primary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-meckury-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Beat Requests
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Review custom beat requests
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/admin/submissions" className="card hover:shadow-glow transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-meckury-accent bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Upload className="w-6 h-6 text-meckury-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Song Submissions
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Approve or reject user songs
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/admin/portfolio/create" className="card hover:shadow-glow transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500 bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Music className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Upload Portfolio Track
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Add Meckury production to portfolio
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/admin/stems" className="card hover:shadow-glow transition-all">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-meckury-secondary bg-opacity-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-meckury-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    Stems Requests
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Upload stems for exclusive buyers
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity (Placeholder) */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-white mb-6">
              Recent Activity
            </h2>
            <div className="card text-center py-12">
              <TrendingUp className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <p className="text-text-secondary">
                Activity feed coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
