'use client'

/**
 * Beat Request Page Component
 * 
 * Allows users to request custom beats from Meckury with:
 * - Detailed description and reference tracks
 * - Voice note recording or upload
 * - ₦10,000 upfront payment via Paystack
 * - Automatic request submission after payment
 * 
 * @route /beats/request
 */

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Mic,
  MicOff,
  Upload,
  X,
  Link as LinkIcon,
  Plus,
  Trash2,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  CreditCard,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { PaystackOptions, PaystackResponse } from '@/types/paystack'

/**
 * Constants
 */
const MAX_RECORDING_TIME = 120 // 2 minutes in seconds
const MAX_FILE_SIZE = 6 * 1024 * 1024 // 6MB in bytes
const MAX_REFERENCE_URLS = 5
const UPFRONT_PAYMENT_AMOUNT = 10000 // ₦10,000

/**
 * Beat Request Page Component
 */
export default function BeatRequestPage() {
  const router = useRouter()
  
  // User state
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [referenceUrls, setReferenceUrls] = useState<string[]>([''])
  const [voiceNoteFile, setVoiceNoteFile] = useState<File | null>(null)
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Refs for media handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /**
   * Component initialization
   * Check authentication and cleanup on unmount
   */
  useEffect(() => {
    checkAuth()
    
    return () => {
      // Cleanup timers and audio on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  /**
   * Verify user authentication
   * Redirect to sign-in if not authenticated
   */
  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      
      if (!user) {
        toast.error('Please sign in to request a custom beat')
        router.push('/auth/signin')
        return
      }
      
      setUser(user)
    } catch (error) {
      console.error('Authentication error:', error)
      toast.error('Authentication failed. Please sign in.')
      router.push('/auth/signin')
    }
  }

  /**
   * Voice Recording Functions
   */

  /**
   * Start recording audio from microphone
   */
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Handle incoming audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start recording timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Auto-stop at max time
          if (prev >= MAX_RECORDING_TIME) {
            stopRecording()
            return MAX_RECORDING_TIME
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      toast.error('Could not access microphone. Please check permissions.')
    }
  }

  /**
   * Stop recording audio
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  /**
   * Delete recorded audio
   */
  const deleteRecording = () => {
    setAudioBlob(null)
    setRecordingTime(0)
    setIsPlaying(false)
    
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }

  /**
   * Toggle audio playback
   */
  const togglePlayback = () => {
    if (!audioBlob) return

    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(URL.createObjectURL(audioBlob))
        audioRef.current.onended = () => setIsPlaying(false)
      }
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  /**
   * Format seconds to MM:SS
   * 
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Reference URL Management Functions
   */

  /**
   * Add a new reference URL field
   */
  const addReferenceUrl = () => {
    if (referenceUrls.length < MAX_REFERENCE_URLS) {
      setReferenceUrls([...referenceUrls, ''])
    } else {
      toast.error(`Maximum ${MAX_REFERENCE_URLS} reference URLs allowed`)
    }
  }

  /**
   * Update a reference URL at specific index
   * 
   * @param index - URL field index
   * @param value - New URL value
   */
  const updateReferenceUrl = (index: number, value: string) => {
    const newUrls = [...referenceUrls]
    newUrls[index] = value
    setReferenceUrls(newUrls)
  }

  /**
   * Remove a reference URL field
   * 
   * @param index - URL field index to remove
   */
  const removeReferenceUrl = (index: number) => {
    if (referenceUrls.length > 1) {
      setReferenceUrls(referenceUrls.filter((_, i) => i !== index))
    } else {
      toast.error('At least one reference URL is required')
    }
  }

  /**
   * File Upload Functions
   */

  /**
   * Handle voice note file upload
   * 
   * @param e - File input change event
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.`)
      return
    }

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file')
      return
    }

    setVoiceNoteFile(file)
    toast.success('Audio file uploaded successfully')
  }

  /**
   * Form Validation
   */

  /**
   * Validate form inputs before submission
   * 
   * @returns True if form is valid
   */
  const validateForm = (): boolean => {
    // Validate title
    if (!title.trim()) {
      toast.error('Please enter a title for your beat request')
      return false
    }

    // Validate description
    if (!description.trim()) {
      toast.error('Please provide a detailed description')
      return false
    }

    if (description.trim().length < 50) {
      toast.error('Description should be at least 50 characters')
      return false
    }

    // Validate reference URLs
    const validUrls = referenceUrls.filter((url) => url.trim() !== '')
    if (validUrls.length === 0) {
      toast.error('Please add at least one reference URL')
      return false
    }

    return true
  }

  /**
   * Form Submission
   */

  /**
   * Handle form submission
   * Validates form and initiates payment flow
   * 
   * @param e - Form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Please sign in first')
      router.push('/auth/signin')
      return
    }

    // Validate form inputs
    if (!validateForm()) {
      return
    }

    // Proceed to payment
    initiateBeatRequestPayment()
  }

  /**
   * Payment Processing
   */

  /**
   * Initialize Paystack payment for beat request
   * Opens payment modal with configured options
   */
  const initiateBeatRequestPayment = () => {
    // Prevent duplicate payment attempts
    if (paymentProcessing) {
      toast.error('Payment already in progress')
      return
    }

    // Verify Paystack is loaded
    if (!window.PaystackPop) {
      toast.error('Payment system is loading. Please wait a moment and try again.')
      console.error('❌ Paystack not available on window object')
      return
    }

    // Verify Paystack key is configured
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!paystackKey) {
      toast.error('Payment configuration error. Please contact support.')
      console.error('❌ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY not configured')
      return
    }

    // Validate user email
    if (!user?.email) {
      toast.error('Email address is required for payment')
      return
    }

    setPaymentProcessing(true)

    try {
      // Generate unique payment reference
      const paymentRef = `beat-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Configure Paystack options
      const paystackOptions: PaystackOptions = {
        key: paystackKey,
        email: user.email,
        amount: UPFRONT_PAYMENT_AMOUNT * 100, // Convert to kobo
        ref: paymentRef,
        currency: 'NGN',
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {
          type: 'beat_request_upfront',
          user_id: user.id,
          user_email: user.email,
          request_title: title.trim(),
        },
        onSuccess: (response: PaystackResponse) => {
          console.log('✅ Payment successful:', response.reference)
          handlePaymentSuccess(response.reference)
        },
        onCancel: () => {
          console.log('Payment cancelled by user')
          setPaymentProcessing(false)
          toast.error('Payment was cancelled')
        },
        onClose: () => {
          console.log('Payment modal closed')
          setPaymentProcessing(false)
        }
      }

      console.log('Initializing beat request payment...', {
        amount: UPFRONT_PAYMENT_AMOUNT,
        email: user.email,
        reference: paymentRef
      })

      // Open Paystack payment modal
      const handler = window.PaystackPop.setup(paystackOptions)
      handler.openIframe()
    } catch (error) {
      console.error('❌ Error initializing payment:', error)
      toast.error('Failed to initialize payment. Please try again.')
      setPaymentProcessing(false)
    }
  }

  /**
   * Handle successful payment completion
   * Uploads voice note and creates beat request record
   * 
   * @param paymentRef - Paystack payment reference
   */
  const handlePaymentSuccess = async (paymentRef: string) => {
    setLoading(true)

    try {
      let voiceNoteUrl: string | null = null

      // Upload voice note if exists (recorded or uploaded)
      if (audioBlob || voiceNoteFile) {
        console.log('Uploading voice note to Supabase storage...')
        
        // Convert blob to file if needed
        const fileToUpload = audioBlob 
          ? new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' })
          : voiceNoteFile!

        // Generate unique filename
        const sanitizedFilename = fileToUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${user.id}/${Date.now()}-${sanitizedFilename}`
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('beat-request-voices')
          .upload(fileName, fileToUpload, {
            cacheControl: '3600',
            upsert: false,
            contentType: fileToUpload.type
          })

        if (uploadError) {
          console.error('Voice note upload error:', uploadError)
          throw new Error(`Voice note upload failed: ${uploadError.message}`)
        }

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('beat-request-voices')
          .getPublicUrl(fileName)

        voiceNoteUrl = urlData.publicUrl
        console.log('✅ Voice note uploaded:', voiceNoteUrl)
      }

      // Filter out empty reference URLs
      const validUrls = referenceUrls.filter((url) => url.trim() !== '')

      // Create beat request record in database
      const { error: insertError } = await supabase
        .from('beat_requests')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          reference_urls: validUrls,
          voice_note_url: voiceNoteUrl,
          status: 'pending', // Waiting for producer to start work
          payment_reference: paymentRef,
          payment_status: 'completed',
          upfront_amount: UPFRONT_PAYMENT_AMOUNT,
          upfront_paid_at: new Date().toISOString(),
          client_response: 'pending',
          revision_count: 0,
          strike_count: 0,
        })

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw insertError
      }

      toast.success('🎵 Payment successful! Your beat request has been submitted.')
      
      // Redirect to dashboard after delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('❌ Error submitting beat request:', error)
      toast.error(
        error.message || 
        'Payment succeeded but there was an error. Please contact support with reference: ' + paymentRef
      )
    } finally {
      setLoading(false)
      setPaymentProcessing(false)
    }
  }

  /**
   * Render loading state if user not authenticated
   */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-text-secondary">Checking authentication...</p>
        </div>
      </div>
    )
  }

  /**
   * Main Component Render
   */
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-32 pb-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center space-x-2 mb-4">
              <h1 className="text-5xl font-display font-bold text-white">
                Request a Custom Beat
              </h1>
            </div>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-4">
              Share your vision with Meckury. Provide reference tracks, detailed descriptions, 
              and even voice notes to help bring your perfect beat to life.
            </p>
            
            {/* Payment Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-meckury-primary bg-opacity-10 rounded-lg border border-meckury-primary">
              <CreditCard className="w-5 h-5 text-meckury-primary" />
              <span className="text-white font-semibold">
                ₦{UPFRONT_PAYMENT_AMOUNT.toLocaleString()} upfront payment required
              </span>
            </div>
          </div>

          {/* Request Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Input */}
            <div className="card">
              <label htmlFor="beat-title" className="block text-white font-semibold mb-2">
                Beat Title / Working Name *
              </label>
              <input
                id="beat-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g., "Dark Trap Beat" or "Emotional R&B Instrumental"'
                className="input w-full"
                maxLength={100}
                required
                disabled={loading || paymentProcessing}
                aria-required="true"
              />
              <p className="text-text-muted text-sm mt-2">
                What would you like to call this beat?
              </p>
            </div>

            {/* Description Textarea */}
            <div className="card">
              <label htmlFor="beat-description" className="block text-white font-semibold mb-2">
                Detailed Description *
              </label>
              <textarea
                id="beat-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the vibe, genre, tempo, instruments, mood, and any specific elements you want. The more detail, the better! (Minimum 50 characters)"
                className="input w-full min-h-[150px] resize-y"
                maxLength={2000}
                required
                disabled={loading || paymentProcessing}
                aria-required="true"
              />
              <p className="text-text-muted text-sm mt-2">
                {description.length}/2000 characters
                {description.length > 0 && description.length < 50 && (
                  <span className="text-meckury-danger ml-2">
                    (Need {50 - description.length} more characters)
                  </span>
                )}
              </p>
            </div>

            {/* Reference URLs */}
            <div className="card">
              <label className="block text-white font-semibold mb-2">
                Reference Tracks * (1-{MAX_REFERENCE_URLS} links)
              </label>
              <p className="text-text-secondary text-sm mb-4">
                Share links to songs that inspire the sound you're looking for 
                (YouTube, Spotify, SoundCloud, etc.)
              </p>
              
              <div className="space-y-3">
                {referenceUrls.map((url, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <LinkIcon className="w-5 h-5 text-meckury-primary flex-shrink-0" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateReferenceUrl(index, e.target.value)}
                      placeholder={`Reference track #${index + 1} URL`}
                      className="input flex-1"
                      disabled={loading || paymentProcessing}
                      aria-label={`Reference track ${index + 1}`}
                    />
                    {referenceUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReferenceUrl(index)}
                        className="p-2 text-meckury-danger hover:bg-meckury-danger hover:bg-opacity-10 rounded-lg transition-colors"
                        disabled={loading || paymentProcessing}
                        aria-label={`Remove reference track ${index + 1}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {referenceUrls.length < MAX_REFERENCE_URLS && (
                <button
                  type="button"
                  onClick={addReferenceUrl}
                  className="mt-3 flex items-center space-x-2 text-meckury-primary hover:text-meckury-accent transition-colors font-semibold"
                  disabled={loading || paymentProcessing}
                  aria-label="Add another reference track"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Another Reference</span>
                </button>
              )}
            </div>

            {/* Voice Note Section */}
            <div className="card">
              <label className="block text-white font-semibold mb-2">
                Voice Note (Optional)
              </label>
              <p className="text-text-secondary text-sm mb-4">
                Record yourself humming, singing, or describing the vibe. 
                Max {MAX_RECORDING_TIME / 60} minutes. You can also upload an audio file ({MAX_FILE_SIZE / 1024 / 1024}MB max).
              </p>

              {/* No Voice Note State - Show Recording/Upload Options */}
              {!audioBlob && !voiceNoteFile && (
                <div className="space-y-4">
                  {/* Recording Interface */}
                  <div className="flex items-center justify-center">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="btn-primary flex items-center space-x-2 px-8 py-4"
                        disabled={loading || paymentProcessing}
                        aria-label="Start voice recording"
                      >
                        <Mic className="w-6 h-6" />
                        <span>Start Recording</span>
                      </button>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        {/* Recording Timer */}
                        <div className="flex items-center space-x-4">
                          <div className="w-4 h-4 bg-meckury-danger rounded-full animate-pulse" aria-label="Recording indicator"></div>
                          <span className="text-2xl font-mono text-white">
                            {formatTime(recordingTime)}
                          </span>
                          <span className="text-text-muted">/ {formatTime(MAX_RECORDING_TIME)}</span>
                        </div>
                        
                        {/* Stop Recording Button */}
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="btn-outline flex items-center space-x-2"
                          aria-label="Stop recording"
                        >
                          <MicOff className="w-5 h-5" />
                          <span>Stop Recording</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 border-t border-meckury-mediumGray"></div>
                    <span className="text-text-muted text-sm">OR</span>
                    <div className="flex-1 border-t border-meckury-mediumGray"></div>
                  </div>

                  {/* File Upload Button */}
                  <label className="btn-outline flex items-center justify-center space-x-2 cursor-pointer">
                    <Upload className="w-5 h-5" />
                    <span>Upload Audio File</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={loading || paymentProcessing}
                      aria-label="Upload audio file"
                    />
                  </label>
                </div>
              )}

              {/* Recorded Audio Playback */}
              {audioBlob && (
                <div className="bg-background-elevated rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-meckury-success" />
                      <span className="text-white font-semibold">
                        Voice Note Recorded
                      </span>
                    </div>
                    <span className="text-text-muted text-sm">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={togglePlayback}
                      className="btn-primary flex items-center space-x-2"
                      disabled={loading || paymentProcessing}
                      aria-label={isPlaying ? 'Pause playback' : 'Play recording'}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="btn-outline flex items-center space-x-2 text-meckury-danger hover:bg-meckury-danger hover:bg-opacity-10"
                      disabled={loading || paymentProcessing}
                      aria-label="Delete recording"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Uploaded File Display */}
              {voiceNoteFile && (
                <div className="bg-background-elevated rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-meckury-success" />
                      <div>
                        <p className="text-white font-semibold">
                          {voiceNoteFile.name}
                        </p>
                        <p className="text-text-muted text-sm">
                          {(voiceNoteFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => setVoiceNoteFile(null)}
                      className="p-2 text-meckury-danger hover:bg-meckury-danger hover:bg-opacity-10 rounded-lg transition-colors"
                      disabled={loading || paymentProcessing}
                      aria-label="Remove uploaded file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Information Alert */}
            <div className="card bg-meckury-primary bg-opacity-10 border border-meckury-primary">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-meckury-primary flex-shrink-0 mt-1" />
                <div className="text-sm text-text-secondary space-y-2">
                  <p>
                    <strong className="text-white">How It Works:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Pay ₦{UPFRONT_PAYMENT_AMOUNT.toLocaleString()} upfront to submit your request</li>
                    <li>Receive your custom beat within 5-7 business days</li>
                    <li>You have 2 opportunities to approve the beat</li>
                    <li>If approved: Pay ₦10k more (lease) or ₦70k (exclusive)</li>
                    <li>If you decline twice: Receive a full refund</li>
                    <li>One free revision included with your request</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading || paymentProcessing}
                className="btn-primary px-12 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
                aria-label="Submit beat request and proceed to payment"
              >
                {loading || paymentProcessing ? (
                  <>
                    <div className="spinner w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{paymentProcessing ? 'Processing Payment...' : 'Submitting Request...'}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    <span>Pay ₦{UPFRONT_PAYMENT_AMOUNT.toLocaleString()} & Submit Request</span>
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
