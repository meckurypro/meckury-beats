'use client'

import { useState } from 'react'
import { Upload, Music, Loader2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface BeatUploadFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function BeatUploadForm({ onClose, onSuccess }: BeatUploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    cover: 0,
    mp3: 0,
    wav: 0
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    bpm: '',
    key: '',
    genre: '',
    mood: '',
    type_beat: '',
    lease_price: '20000',
    exclusive_price: '80000',
    featured: false,
    active: true
  })

  const [files, setFiles] = useState({
    cover: null as File | null,
    mp3: null as File | null,
    wav: null as File | null
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData(prev => ({ 
      ...prev, 
      title,
      slug: generateSlug(title)
    }))
  }

  const handleFileChange = (type: 'cover' | 'mp3' | 'wav', file: File | null) => {
    console.log(`File selected for ${type}:`, file?.name, file?.size)
    setFiles(prev => ({ ...prev, [type]: file }))
    
    // Preview for cover image
    if (type === 'cover' && file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateFiles = () => {
    console.log('Validating files:', files)
    
    if (!files.cover) {
      toast.error('Cover art is required')
      return false
    }
    if (!files.mp3) {
      toast.error('MP3 file is required')
      return false
    }
    if (!files.wav) {
      toast.error('WAV file is required')
      return false
    }

    // Check file types
    if (!files.cover.type.startsWith('image/')) {
      toast.error('Cover art must be an image')
      return false
    }
    if (!files.mp3.type.includes('audio/mpeg') && !files.mp3.name.endsWith('.mp3')) {
      toast.error('MP3 file must be an MP3 audio file')
      return false
    }
    if (!files.wav.type.includes('audio/wav') && !files.wav.name.endsWith('.wav')) {
      toast.error('WAV file must be a WAV audio file')
      return false
    }

    // Check file sizes (cover: 5MB, audio: 50MB each)
    if (files.cover.size > 5 * 1024 * 1024) {
      toast.error('Cover art must be less than 5MB')
      return false
    }
    if (files.mp3.size > 50 * 1024 * 1024) {
      toast.error('MP3 file must be less than 50MB')
      return false
    }
    if (files.wav.size > 50 * 1024 * 1024) {
      toast.error('WAV file must be less than 50MB')
      return false
    }

    return true
  }

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${path}/${fileName}`

    console.log(`Uploading to ${bucket}/${filePath}...`)

    const { error, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log('Upload successful:', publicUrl)
    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted')
    console.log('Current files state:', files)
    
    if (!formData.title) {
      toast.error('Beat title is required')
      return
    }
    
    if (!validateFiles()) return

    setLoading(true)
    const loadingToast = toast.loading('Preparing upload...')

    try {
      // Check if slug already exists
      const { data: existingBeat } = await supabase
        .from('beats')
        .select('id')
        .eq('slug', formData.slug)
        .single()

      if (existingBeat) {
        toast.error('A beat with this slug already exists. Please change the title.')
        setLoading(false)
        toast.dismiss(loadingToast)
        return
      }

      // Upload files
      toast.loading('Uploading cover art...', { id: loadingToast })
      const coverUrl = await uploadFile(files.cover!, 'beat-covers', 'covers')
      setUploadProgress(prev => ({ ...prev, cover: 100 }))

      toast.loading('Uploading MP3...', { id: loadingToast })
      const mp3Url = await uploadFile(files.mp3!, 'beat-audio', 'mp3')
      setUploadProgress(prev => ({ ...prev, mp3: 100 }))

      toast.loading('Uploading WAV...', { id: loadingToast })
      const wavUrl = await uploadFile(files.wav!, 'beat-audio', 'wav')
      setUploadProgress(prev => ({ ...prev, wav: 100 }))

      toast.loading('Saving beat...', { id: loadingToast })

      // Create beat record
      const beatData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description || null,
        bpm: formData.bpm ? parseInt(formData.bpm) : null,
        key: formData.key || null,
        genre: formData.genre || null,
        mood: formData.mood || null,
        type_beat: formData.type_beat || null,
        lease_price: parseInt(formData.lease_price),
        exclusive_price: parseInt(formData.exclusive_price),
        featured: formData.featured,
        active: formData.active,
        cover_art_url: coverUrl,
        mp3_url: mp3Url,
        wav_url: wavUrl,
      }

      console.log('Inserting beat data:', beatData)

      const { error: insertError } = await supabase
        .from('beats')
        .insert(beatData)

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      toast.success('Beat uploaded successfully!', { id: loadingToast })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error uploading beat:', error)
      toast.error(error.message || 'Failed to upload beat', { id: loadingToast })
    } finally {
      setLoading(false)
    }
  }

  const FileUpload = ({ 
    type, 
    label, 
    accept 
  }: { 
    type: 'cover' | 'mp3' | 'wav'
    label: string
    accept: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {label} *
      </label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-meckury-mediumGray rounded-lg hover:border-red-500 transition-colors">
        <div className="space-y-1 text-center w-full">
          <div className="flex text-sm text-text-secondary justify-center">
            <label className="relative cursor-pointer rounded-md font-medium text-red-500 hover:text-red-400 focus-within:outline-none">
              <span>Upload file</span>
              <input
                type="file"
                accept={accept}
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null
                  handleFileChange(type, selectedFile)
                }}
                className="sr-only"
                disabled={loading}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-text-muted">
            {type === 'cover' ? 'PNG, JPG, GIF up to 5MB' : 
             type === 'mp3' ? 'MP3 up to 50MB' : 'WAV up to 50MB'}
          </p>
          {files[type] && (
            <p className="text-xs text-green-500 mt-2 font-semibold">
              ✓ {files[type]!.name} ({(files[type]!.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {uploadProgress[type] > 0 && uploadProgress[type] < 100 && (
            <div className="w-full bg-meckury-mediumGray rounded-full h-2 mt-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress[type]}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-background-card rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white">Upload New Beat</h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-text-muted hover:text-white transition-colors text-2xl disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Preview Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Cover Art Preview
                </label>
                <div className="aspect-square rounded-lg overflow-hidden bg-background-elevated border-2 border-dashed border-meckury-mediumGray flex items-center justify-center">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Cover preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-12 h-12 text-meckury-mediumGray mx-auto mb-2" />
                      <p className="text-text-muted text-sm">Cover preview</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Beat Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      className="input"
                      placeholder="Enter beat title"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Slug *
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="text-text-muted text-sm bg-background-elevated px-3 py-2 rounded-lg flex-1">
                        {formData.slug || 'auto-generated-from-title'}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.title) }))}
                        className="text-sm text-red-500 hover:text-red-400 transition-colors"
                        disabled={loading}
                      >
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FileUpload 
                type="cover"
                label="Cover Art"
                accept="image/*"
              />
              <FileUpload 
                type="mp3"
                label="MP3 File"
                accept="audio/mpeg,audio/mp3,.mp3"
              />
              <FileUpload 
                type="wav"
                label="WAV File"
                accept="audio/wav,audio/x-wav,.wav"
              />
            </div>

            {/* Advanced Options Toggle */}
            <div className="pt-4 border-t border-meckury-mediumGray">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-red-500 hover:text-red-400 transition-colors font-medium"
              >
                {showAdvanced ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
              </button>
            </div>

            {/* Advanced Options */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-background-elevated rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    BPM
                  </label>
                  <input
                    type="number"
                    name="bpm"
                    value={formData.bpm}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., 140"
                    min="60"
                    max="200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Key
                  </label>
                  <select
                    name="key"
                    value={formData.key}
                    onChange={handleInputChange}
                    className="input"
                    disabled={loading}
                  >
                    <option value="">Select key</option>
                    <option value="C">C</option>
                    <option value="C#">C#</option>
                    <option value="D">D</option>
                    <option value="D#">D#</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="F#">F#</option>
                    <option value="G">G</option>
                    <option value="G#">G#</option>
                    <option value="A">A</option>
                    <option value="A#">A#</option>
                    <option value="B">B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Genre
                  </label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., Afrobeats, Trap"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Mood
                  </label>
                  <input
                    type="text"
                    name="mood"
                    value={formData.mood}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., Dark, Melodic"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Type Beat
                  </label>
                  <input
                    type="text"
                    name="type_beat"
                    value={formData.type_beat}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., Travis Scott Type Beat"
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="textarea h-24"
                    placeholder="Optional beat description..."
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Pricing & Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Lease Price (₦) *
                </label>
                <input
                  type="number"
                  name="lease_price"
                  value={formData.lease_price}
                  onChange={handleInputChange}
                  className="input"
                  min="0"
                  step="1000"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-text-muted mt-1">
                  Default: ₦20,000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Exclusive Price (₦) *
                </label>
                <input
                  type="number"
                  name="exclusive_price"
                  value={formData.exclusive_price}
                  onChange={handleInputChange}
                  className="input"
                  min="0"
                  step="1000"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-text-muted mt-1">
                  Default: ₦80,000
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="mr-3"
                    id="featured"
                    disabled={loading}
                  />
                  <label htmlFor="featured" className="text-sm text-text-secondary">
                    Mark as Featured
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                    className="mr-3"
                    id="active"
                    disabled={loading}
                  />
                  <label htmlFor="active" className="text-sm text-text-secondary">
                    Publish Immediately
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-meckury-mediumGray">
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !files.cover || !files.mp3 || !files.wav}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-all flex items-center justify-center space-x-2 min-w-[160px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>Upload Beat</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
