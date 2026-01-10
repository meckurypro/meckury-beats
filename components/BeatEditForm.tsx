// components/BeatEditForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Loader2, Music, Image as ImageIcon, FileAudio, Trash2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface BeatEditFormProps {
  beat: {
    id: string
    title: string
    slug: string
    description: string | null
    bpm: number | null
    key: string | null
    mood: string | null
    genre: string | null
    type_beat: string | null
    collaborators: string | null
    cover_art_url: string
    mp3_url: string
    wav_url: string
    lease_price: number
    exclusive_price: number
    featured: boolean
    active: boolean
  }
  onClose: () => void
  onSuccess: () => void
}

export default function BeatEditForm({ beat, onClose, onSuccess }: BeatEditFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: beat.title,
    description: beat.description || '',
    bpm: beat.bpm || '',
    key: beat.key || '',
    mood: beat.mood || '',
    genre: beat.genre || '',
    type_beat: beat.type_beat || '',
    collaborators: beat.collaborators || '',
    lease_price: beat.lease_price,
    exclusive_price: beat.exclusive_price,
    featured: beat.featured,
    active: beat.active,
  })

  // File previews
  const [coverPreview, setCoverPreview] = useState(beat.cover_art_url)
  const [mp3File, setMp3File] = useState<File | null>(null)
  const [wavFile, setWavFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  // URLs for new uploads
  const [newCoverUrl, setNewCoverUrl] = useState<string | null>(null)
  const [newMp3Url, setNewMp3Url] = useState<string | null>(null)
  const [newWavUrl, setNewWavUrl] = useState<string | null>(null)

  // Genre and mood options
  const genreOptions = [
    'Trap', 'Drill', 'Afrobeats', 'Afro-fusion', 'Hip Hop', 'R&B',
    'Pop', 'Dancehall', 'Amapiano', 'House', 'EDM', 'Other'
  ]

  const moodOptions = [
    'Dark', 'Melodic', 'Aggressive', 'Chill', 'Uplifting', 
    'Emotional', 'Energetic', 'Smooth', 'Bouncy', 'Ambient'
  ]

  const keyOptions = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name === 'bpm' || name === 'lease_price' || name === 'exclusive_price') {
      const numValue = value === '' ? '' : Number(value)
      setFormData(prev => ({ ...prev, [name]: numValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'cover' | 'mp3' | 'wav') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (fileType === 'cover') {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    } else if (fileType === 'mp3') {
      if (file.type !== 'audio/mpeg' && !file.name.endsWith('.mp3')) {
        toast.error('Please select a valid MP3 file')
        return
      }
      setMp3File(file)
    } else if (fileType === 'wav') {
      if (file.type !== 'audio/wav' && file.type !== 'audio/x-wav' && !file.name.endsWith('.wav')) {
        toast.error('Please select a valid WAV file')
        return
      }
      setWavFile(file)
    }
  }

  const deleteOldFile = async (url: string) => {
    try {
      // Extract file path from URL
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const bucketIndex = pathParts.findIndex(part => part === 'storage' || part === 'object')
      
      if (bucketIndex === -1) return
      
      const bucket = pathParts[bucketIndex + 2] // Usually 'beats'
      const filePath = pathParts.slice(bucketIndex + 3).join('/')
      
      if (bucket && filePath) {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath])
        
        if (error) {
          console.error('Error deleting old file:', error)
        }
      }
    } catch (error) {
      console.error('Error parsing file URL:', error)
    }
  }

  const uploadFile = async (file: File, path: string, bucket: string = 'beats'): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Beat title is required')
      return
    }

    if (!formData.genre) {
      toast.error('Genre is required')
      return
    }

    setLoading(true)

    try {
      // Upload new files if selected
      let coverUrl = beat.cover_art_url
      let mp3Url = beat.mp3_url
      let wavUrl = beat.wav_url

      // Upload cover art
      if (coverFile) {
        setUploading('cover')
        const timestamp = Date.now()
        const fileName = `cover-${beat.slug}-${timestamp}.${coverFile.name.split('.').pop()}`
        coverUrl = await uploadFile(coverFile, `covers/${fileName}`)
        setNewCoverUrl(coverUrl)
        
        // Delete old cover
        if (beat.cover_art_url !== coverUrl) {
          await deleteOldFile(beat.cover_art_url)
        }
      }

      // Upload MP3
      if (mp3File) {
        setUploading('mp3')
        const timestamp = Date.now()
        const fileName = `mp3-${beat.slug}-${timestamp}.mp3`
        mp3Url = await uploadFile(mp3File, `audio/mp3/${fileName}`)
        setNewMp3Url(mp3Url)
        
        // Delete old MP3
        if (beat.mp3_url !== mp3Url) {
          await deleteOldFile(beat.mp3_url)
        }
      }

      // Upload WAV
      if (wavFile) {
        setUploading('wav')
        const timestamp = Date.now()
        const fileName = `wav-${beat.slug}-${timestamp}.wav`
        wavUrl = await uploadFile(wavFile, `audio/wav/${fileName}`)
        setNewWavUrl(wavUrl)
        
        // Delete old WAV
        if (beat.wav_url !== wavUrl) {
          await deleteOldFile(beat.wav_url)
        }
      }

      setUploading('saving')

      // Update beat in database
      const { error: updateError } = await supabase
        .from('beats')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          bpm: formData.bpm || null,
          key: formData.key || null,
          mood: formData.mood || null,
          genre: formData.genre || null,
          type_beat: formData.type_beat.trim() || null,
          collaborators: formData.collaborators.trim() || null,
          cover_art_url: coverUrl,
          mp3_url: mp3Url,
          wav_url: wavUrl,
          lease_price: Number(formData.lease_price),
          exclusive_price: Number(formData.exclusive_price),
          featured: formData.featured,
          active: formData.active,
        })
        .eq('id', beat.id)

      if (updateError) throw updateError

      toast.success('Beat updated successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating beat:', error)
      toast.error(error.message || 'Failed to update beat')
    } finally {
      setLoading(false)
      setUploading(null)
    }
  }

  const getUploadingMessage = () => {
    switch (uploading) {
      case 'cover': return 'Uploading cover art...'
      case 'mp3': return 'Uploading MP3 file...'
      case 'wav': return 'Uploading WAV file...'
      case 'saving': return 'Saving changes...'
      default: return 'Processing...'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-background-card border-b border-meckury-mediumGray px-8 py-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Edit Beat</h2>
            <p className="text-text-secondary">{beat.title}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-white transition-colors p-2 hover:bg-meckury-mediumGray rounded-lg"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Music className="w-5 h-5 mr-2 text-meckury-primary" />
              Basic Information
            </h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Beat Title <span className="text-meckury-danger">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="input w-full"
                placeholder="e.g., Dark Trap Beat"
              />
            </div>

            {/* Type Beat */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Type Beat
              </label>
              <input
                type="text"
                name="type_beat"
                value={formData.type_beat}
                onChange={handleInputChange}
                disabled={loading}
                className="input w-full"
                placeholder="e.g., Travis Scott Type Beat"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                disabled={loading}
                rows={4}
                className="input w-full resize-none"
                placeholder="Describe your beat..."
              />
            </div>

            {/* Collaborators */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Collaborators
              </label>
              <input
                type="text"
                name="collaborators"
                value={formData.collaborators}
                onChange={handleInputChange}
                disabled={loading}
                className="input w-full"
                placeholder="e.g., John Doe, Jane Smith"
              />
              <p className="text-xs text-text-muted mt-1">Comma-separated names for producer credits</p>
            </div>
          </div>

          {/* Musical Details */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Musical Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* BPM */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  BPM
                </label>
                <input
                  type="number"
                  name="bpm"
                  value={formData.bpm}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="1"
                  max="300"
                  className="input w-full"
                  placeholder="e.g., 140"
                />
              </div>

              {/* Key */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Key
                </label>
                <select
                  name="key"
                  value={formData.key}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="input w-full"
                >
                  <option value="">Select Key</option>
                  {keyOptions.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Genre <span className="text-meckury-danger">*</span>
                </label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                  className="input w-full"
                >
                  <option value="">Select Genre</option>
                  {genreOptions.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Mood
              </label>
              <select
                name="mood"
                value={formData.mood}
                onChange={handleInputChange}
                disabled={loading}
                className="input w-full"
              >
                <option value="">Select Mood</option>
                {moodOptions.map(mood => (
                  <option key={mood} value={mood}>{mood}</option>
                ))}
              </select>
            </div>
          </div>

          {/* File Uploads */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Upload className="w-5 h-5 mr-2 text-meckury-primary" />
              Files (Optional - only upload to replace)
            </h3>

            <div className="bg-meckury-darkGray bg-opacity-30 border border-meckury-mediumGray rounded-lg p-4">
              <div className="flex items-start space-x-2 text-yellow-500">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Uploading new files will permanently delete the old files from storage.
                </p>
              </div>
            </div>

            {/* Cover Art */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Cover Art
              </label>
              <div className="flex items-start space-x-4">
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-background-elevated flex-shrink-0">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'cover')}
                    disabled={loading}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className={`btn-outline inline-flex items-center space-x-2 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Replace Cover Art</span>
                  </label>
                  {coverFile && (
                    <div className="mt-2 flex items-center space-x-2">
                      <p className="text-sm text-meckury-success">✓ New file selected: {coverFile.name}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCoverFile(null)
                          setCoverPreview(beat.cover_art_url)
                        }}
                        className="text-meckury-danger hover:text-meckury-danger/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MP3 File */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                MP3 File
              </label>
              <input
                type="file"
                accept="audio/mpeg,.mp3"
                onChange={(e) => handleFileSelect(e, 'mp3')}
                disabled={loading}
                className="hidden"
                id="mp3-upload"
              />
              <label
                htmlFor="mp3-upload"
                className={`btn-outline inline-flex items-center space-x-2 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileAudio className="w-4 h-4" />
                <span>Replace MP3 File</span>
              </label>
              {mp3File && (
                <div className="mt-2 flex items-center space-x-2">
                  <p className="text-sm text-meckury-success">✓ New file selected: {mp3File.name}</p>
                  <button
                    type="button"
                    onClick={() => setMp3File(null)}
                    className="text-meckury-danger hover:text-meckury-danger/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* WAV File */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                WAV File
              </label>
              <input
                type="file"
                accept="audio/wav,audio/x-wav,.wav"
                onChange={(e) => handleFileSelect(e, 'wav')}
                disabled={loading}
                className="hidden"
                id="wav-upload"
              />
              <label
                htmlFor="wav-upload"
                className={`btn-outline inline-flex items-center space-x-2 cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FileAudio className="w-4 h-4" />
                <span>Replace WAV File</span>
              </label>
              {wavFile && (
                <div className="mt-2 flex items-center space-x-2">
                  <p className="text-sm text-meckury-success">✓ New file selected: {wavFile.name}</p>
                  <button
                    type="button"
                    onClick={() => setWavFile(null)}
                    className="text-meckury-danger hover:text-meckury-danger/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Pricing</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lease Price */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Lease Price (₦) <span className="text-meckury-danger">*</span>
                </label>
                <input
                  type="number"
                  name="lease_price"
                  value={formData.lease_price}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  required
                  className="input w-full"
                  placeholder="20000"
                />
              </div>

              {/* Exclusive Price */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Exclusive Price (₦) <span className="text-meckury-danger">*</span>
                </label>
                <input
                  type="number"
                  name="exclusive_price"
                  value={formData.exclusive_price}
                  onChange={handleInputChange}
                  disabled={loading}
                  min="0"
                  required
                  className="input w-full"
                  placeholder="80000"
                />
              </div>
            </div>
          </div>

          {/* Status Toggles */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">Status</h3>

            <div className="flex flex-col space-y-4">
              {/* Featured Toggle */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-5 h-5 rounded border-meckury-mediumGray bg-background-elevated text-meckury-primary focus:ring-2 focus:ring-meckury-primary focus:ring-offset-2 focus:ring-offset-background-card"
                />
                <span className="text-white font-medium">Featured Beat</span>
              </label>

              {/* Active Toggle */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-5 h-5 rounded border-meckury-mediumGray bg-background-elevated text-meckury-success focus:ring-2 focus:ring-meckury-success focus:ring-offset-2 focus:ring-offset-background-card"
                />
                <span className="text-white font-medium">Active (Visible to users)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6 border-t border-meckury-mediumGray">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-outline w-full sm:w-auto px-8"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full sm:w-auto px-8 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{getUploadingMessage()}</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
