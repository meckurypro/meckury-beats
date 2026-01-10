'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Music,
  Upload,
  Link as LinkIcon,
  Save,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

type Platform = 'spotify' | 'youtube' | 'apple_music' | 'audiomack'

export default function AdminPortfolioCreatePage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form state
  const [songTitle, setSongTitle] = useState('')
  const [artistName, setArtistName] = useState('')
  const [description, setDescription] = useState('')
  const [releaseDate, setReleaseDate] = useState('')
  const [artistSocialLink, setArtistSocialLink] = useState('')

  // Media type selection
  const [mediaType, setMediaType] = useState<'link' | 'audio'>('link')
  
  // For streaming links
  const [platform, setPlatform] = useState<Platform>('spotify')
  const [streamingUrl, setStreamingUrl] = useState('')

  // For audio upload
  const [audioFile, setAudioFile] = useState<File | null>(null)

  // Cover art
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null)
  const [coverArtPreview, setCoverArtPreview] = useState<string>('')

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
  }

  const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover art must be less than 5MB')
      return
    }

    setCoverArtFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setCoverArtPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file')
      return
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Audio file must be less than 50MB')
      return
    }

    setAudioFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!songTitle.trim()) {
      toast.error('Please enter song title')
      return
    }

    if (!artistName.trim()) {
      toast.error('Please enter artist name')
      return
    }

    if (!coverArtFile) {
      toast.error('Please upload cover art')
      return
    }

    if (mediaType === 'link' && !streamingUrl.trim()) {
      toast.error('Please enter streaming URL')
      return
    }

    if (mediaType === 'audio' && !audioFile) {
      toast.error('Please upload audio file')
      return
    }

    setLoading(true)

    try {
      // Upload cover art
      const coverArtFileName = `portfolio/${Date.now()}-${coverArtFile.name}`
      const { error: coverUploadError } = await supabase.storage
        .from('beats')
        .upload(coverArtFileName, coverArtFile)

      if (coverUploadError) throw coverUploadError

      const { data: coverUrlData } = supabase.storage
        .from('beats')
        .getPublicUrl(coverArtFileName)

      const coverArtUrl = coverUrlData.publicUrl

      // Upload audio file if provided
      let audioUrl = null
      if (mediaType === 'audio' && audioFile) {
        const audioFileName = `portfolio/${Date.now()}-${audioFile.name}`
        const { error: audioUploadError } = await supabase.storage
          .from('beats')
          .upload(audioFileName, audioFile)

        if (audioUploadError) throw audioUploadError

        const { data: audioUrlData } = supabase.storage
          .from('beats')
          .getPublicUrl(audioFileName)

        audioUrl = audioUrlData.publicUrl
      }

      // Build platform-specific URLs
      const portfolioData: any = {
        title: songTitle.trim(),
        artist_name: artistName.trim(),
        description: description.trim() || null,
        cover_art_url: coverArtUrl,
        audio_url: audioUrl,
        release_date: releaseDate || null,
        featured: false,
        order_index: 0,
      }

      // Add streaming links based on platform
      if (mediaType === 'link' && streamingUrl.trim()) {
        switch (platform) {
          case 'spotify':
            portfolioData.spotify_url = streamingUrl.trim()
            break
          case 'youtube':
            portfolioData.youtube_url = streamingUrl.trim()
            break
          case 'apple_music':
            portfolioData.apple_music_url = streamingUrl.trim()
            break
          case 'audiomack':
            // Store in video_url field (reusing existing field)
            portfolioData.video_url = streamingUrl.trim()
            break
        }
      }

      // Insert portfolio item
      const { error: insertError } = await supabase
        .from('portfolio')
        .insert(portfolioData)

      if (insertError) throw insertError

      toast.success('Portfolio track added successfully! 🎵')
      router.push('/portfolio')
    } catch (error) {
      console.error('Error creating portfolio item:', error)
      toast.error('Failed to create portfolio item')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
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
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center space-x-2 text-meckury-primary hover:text-meckury-accent mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>

            <h1 className="text-4xl font-display font-bold text-white mb-2">
              Add Portfolio Track
            </h1>
            <p className="text-text-secondary">
              Upload a track produced by Meckury to showcase on the portfolio page
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4">
                Track Information
              </h3>

              <div className="space-y-4">
                {/* Song Title */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Song Title *
                  </label>
                  <input
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="Enter song title"
                    className="input w-full"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Artist Name */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Enter artist name"
                    className="input w-full"
                    maxLength={100}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the track..."
                    className="input w-full min-h-[100px] resize-y"
                    maxLength={500}
                  />
                  <p className="text-text-muted text-sm mt-2">
                    {description.length}/500 characters
                  </p>
                </div>

                {/* Release Date */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Release Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="input w-full max-w-xs"
                  />
                </div>

                {/* Artist Social Link */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Artist Social Link (Optional)
                  </label>
                  <div className="flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5 text-meckury-primary" />
                    <input
                      type="url"
                      value={artistSocialLink}
                      onChange={(e) => setArtistSocialLink(e.target.value)}
                      placeholder="Instagram, Twitter, or website URL"
                      className="input flex-1"
                    />
                  </div>
                  <p className="text-text-muted text-sm mt-2">
                    One social media link to feature the artist
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Art */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4">
                Cover Art *
              </h3>

              {coverArtPreview ? (
                <div className="space-y-4">
                  <div className="relative w-64 h-64 mx-auto rounded-lg overflow-hidden">
                    <img
                      src={coverArtPreview}
                      alt="Cover art preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverArtFile(null)
                      setCoverArtPreview('')
                    }}
                    className="btn-outline mx-auto block"
                  >
                    Change Cover Art
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="border-2 border-dashed border-meckury-mediumGray rounded-lg p-8 hover:border-meckury-primary transition-colors">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-meckury-primary bg-opacity-10 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-meckury-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold mb-1">
                          Upload Cover Art
                        </p>
                        <p className="text-text-muted text-sm">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverArtUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Media Type Selection */}
            <div className="card">
              <h3 className="text-xl font-semibold text-white mb-4">
                Track Media *
              </h3>

              {/* Toggle between link and audio */}
              <div className="flex space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => setMediaType('link')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    mediaType === 'link'
                      ? 'bg-meckury-primary text-white'
                      : 'bg-background-elevated text-text-secondary hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-5 h-5 inline-block mr-2" />
                  Streaming Link
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('audio')}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                    mediaType === 'audio'
                      ? 'bg-meckury-primary text-white'
                      : 'bg-background-elevated text-text-secondary hover:text-white'
                  }`}
                >
                  <Upload className="w-5 h-5 inline-block mr-2" />
                  Audio File
                </button>
              </div>

              {/* Streaming Link */}
              {mediaType === 'link' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Platform
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as Platform)}
                      className="input w-full max-w-xs"
                    >
                      <option value="spotify">Spotify</option>
                      <option value="youtube">YouTube</option>
                      <option value="apple_music">Apple Music</option>
                      <option value="audiomack">Audiomack</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Streaming URL
                    </label>
                    <input
                      type="url"
                      value={streamingUrl}
                      onChange={(e) => setStreamingUrl(e.target.value)}
                      placeholder={`Enter ${platform} URL`}
                      className="input w-full"
                      required={mediaType === 'link'}
                    />
                    <p className="text-text-muted text-sm mt-2">
                      Paste the full URL from {platform}
                    </p>
                  </div>
                </div>
              )}

              {/* Audio File Upload */}
              {mediaType === 'audio' && (
                <div>
                  {audioFile ? (
                    <div className="bg-background-elevated rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Music className="w-8 h-8 text-meckury-primary" />
                          <div>
                            <p className="text-white font-semibold">
                              {audioFile.name}
                            </p>
                            <p className="text-text-muted text-sm">
                              {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAudioFile(null)}
                          className="text-meckury-danger hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="border-2 border-dashed border-meckury-mediumGray rounded-lg p-8 hover:border-meckury-primary transition-colors">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="w-16 h-16 bg-meckury-primary bg-opacity-10 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-meckury-primary" />
                          </div>
                          <div className="text-center">
                            <p className="text-white font-semibold mb-1">
                              Upload Audio File
                            </p>
                            <p className="text-text-muted text-sm">
                              MP3, WAV up to 50MB
                            </p>
                          </div>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Info Alert */}
            <div className="card bg-meckury-primary bg-opacity-10 border border-meckury-primary">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-meckury-primary flex-shrink-0 mt-1" />
                <div className="text-sm text-text-secondary">
                  <p className="text-white font-semibold mb-2">
                    Important Notes:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>This track will appear immediately on the portfolio page</li>
                    <li>Make sure all information is accurate before submitting</li>
                    <li>High-quality cover art (square format) works best</li>
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
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Add to Portfolio</span>
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
