'use client'

import { useState } from 'react'
import { X, Upload, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { extractSongData, isValidPlatformUrl, getPlatformName, getYouTubeThumbnail } from '@/lib/platformUtils'
import toast from 'react-hot-toast'

interface SongSubmissionFormProps {
  beatId: string
  beatTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function SongSubmissionForm({
  beatId,
  beatTitle,
  onClose,
  onSuccess,
}: SongSubmissionFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    songUrl: '',
    songTitle: '',
    artistName: '',
  })
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null)
  const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null)
  const [urlValidated, setUrlValidated] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)

  const handleUrlValidation = () => {
    const data = extractSongData(formData.songUrl)
    
    if (!data) {
      toast.error('Invalid URL. Please use Spotify, YouTube, Apple Music, or Audiomack links.')
      setUrlValidated(false)
      setExtractedData(null)
      return
    }

    setExtractedData(data)
    setUrlValidated(true)
    
    // If YouTube, auto-set thumbnail
    if (data.platform === 'youtube') {
      const thumbnail = getYouTubeThumbnail(data.songId)
      setCoverArtPreview(thumbnail)
    }
    
    toast.success(`${getPlatformName(data.platform)} link detected!`)
  }

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      
      setCoverArtFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverArtPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!urlValidated || !extractedData) {
      toast.error('Please validate the song URL first')
      return
    }

    if (!formData.songTitle || !formData.artistName) {
      toast.error('Please fill in all fields')
      return
    }

    // For non-YouTube platforms, cover art is required
    if (extractedData.platform !== 'youtube' && !coverArtFile && !coverArtPreview) {
      toast.error('Please upload cover art')
      return
    }

    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let coverArtUrl = coverArtPreview

      // Upload cover art if provided (and not YouTube auto-thumbnail)
      if (coverArtFile) {
        const fileExt = coverArtFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `song-covers/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('song-covers')
          .upload(filePath, coverArtFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('song-covers')
          .getPublicUrl(filePath)

        coverArtUrl = publicUrl
      }

      // Create submission
      const { error: insertError } = await supabase
        .from('song_submissions')
        .insert({
          user_id: user.id,
          beat_id: beatId,
          song_title: formData.songTitle,
          artist_name: formData.artistName,
          platform: extractedData.platform,
          external_url: extractedData.externalUrl,
          embed_url: extractedData.embedUrl,
          cover_art_url: coverArtUrl,
          status: 'pending',
        })

      if (insertError) throw insertError

      toast.success('Song submitted for review! We\'ll notify you when it\'s approved.')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error submitting song:', error)
      toast.error(error.message || 'Failed to submit song')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-background-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="sticky top-0 bg-background-card border-b border-meckury-mediumGray p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Submit Your Song</h2>
            <p className="text-text-secondary text-sm mt-1">
              Made with: <span className="text-meckury-primary">{beatTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Song URL */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Song URL *
            </label>
            <div className="flex space-x-2">
              <input
                type="url"
                value={formData.songUrl}
                onChange={(e) => {
                  setFormData({ ...formData, songUrl: e.target.value })
                  setUrlValidated(false)
                  setExtractedData(null)
                }}
                className="input flex-1"
                placeholder="https://open.spotify.com/track/..."
                required
              />
              <button
                type="button"
                onClick={handleUrlValidation}
                className="btn-secondary px-6"
                disabled={!formData.songUrl}
              >
                Validate
              </button>
            </div>
            <p className="text-text-muted text-xs mt-2">
              Supported: Spotify, YouTube, Apple Music, Audiomack
            </p>
            
            {urlValidated && extractedData && (
              <div className="mt-3 p-3 bg-meckury-success bg-opacity-10 border border-meckury-success rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-meckury-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-meckury-success font-semibold text-sm">
                    {getPlatformName(extractedData.platform)} link validated!
                  </p>
                  <p className="text-text-secondary text-xs mt-1">
                    Your song will be embedded from {getPlatformName(extractedData.platform)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Song Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Song Title *
            </label>
            <input
              type="text"
              value={formData.songTitle}
              onChange={(e) =>
                setFormData({ ...formData, songTitle: e.target.value })
              }
              className="input"
              placeholder="My Amazing Song"
              required
            />
          </div>

          {/* Artist Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Artist Name *
            </label>
            <input
              type="text"
              value={formData.artistName}
              onChange={(e) =>
                setFormData({ ...formData, artistName: e.target.value })
              }
              className="input"
              placeholder="Your Artist Name"
              required
            />
          </div>

          {/* Cover Art Upload (not for YouTube) */}
          {extractedData?.platform !== 'youtube' && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Cover Art * {extractedData && `(required for ${getPlatformName(extractedData.platform)})`}
              </label>
              <div className="flex items-start space-x-4">
                {/* Preview */}
                {coverArtPreview && (
                  <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={coverArtPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="flex-1">
                  <label className="btn-outline cursor-pointer inline-flex items-center space-x-2">
                    <Upload className="w-5 h-5" />
                    <span>{coverArtPreview ? 'Change' : 'Upload'} Cover Art</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverArtChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-text-muted text-xs mt-2">
                    JPG or PNG, max 5MB. Square format recommended (1000x1000px)
                  </p>
                </div>
              </div>
            </div>
          )}

          {extractedData?.platform === 'youtube' && (
            <div className="p-4 bg-meckury-secondary bg-opacity-10 border border-meckury-secondary rounded-lg">
              <p className="text-text-secondary text-sm">
                ℹ️ Cover art will be automatically fetched from YouTube thumbnail
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
            <h4 className="text-white font-semibold mb-2">Submission Review</h4>
            <ul className="space-y-1 text-text-secondary text-sm">
              <li>• Your submission will be reviewed by Meckury</li>
              <li>• Approved songs appear on "Songs From Meckury Beats"</li>
              <li>• You'll be notified via email when approved</li>
              <li>• This gives your music free promotion!</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center"
              disabled={loading || !urlValidated}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                'Submit Song'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
