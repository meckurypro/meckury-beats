'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, RefreshCw, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [copied, setCopied] = useState(false)

  // Get email from query params or session
  useEffect(() => {
    const getEmail = async () => {
      const fromParams = searchParams.get('email')
      if (fromParams) {
        setEmail(fromParams)
      } else {
        // Try to get email from session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email) {
          setEmail(session.user.email)
        }
      }
    }
    getEmail()
  }, [searchParams])

  // Handle copy to clipboard
  const handleCopyToken = () => {
    if (!token) return
    
    navigator.clipboard.writeText(token)
      .then(() => {
        setCopied(true)
        toast.success('Token copied to clipboard!')
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        toast.error('Failed to copy token')
      })
  }

  // Handle verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token.trim()) {
      toast.error('Please enter the verification token from your email')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'signup'
      })

      if (error) throw error

      toast.success('Email verified successfully! Welcome to Meckury Pro!')
      router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification token. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (countdown > 0) return

    setResendLoading(true)
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      })

      if (error) throw error

      toast.success('New verification email sent! Check your inbox.')
      setCountdown(60)
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <Link href="/" className="block text-center mb-8">
          <div className="text-4xl font-display font-bold">
            <span className="text-meckury-primary">Meckury</span>
            <span className="text-white ml-2">Pro</span>
          </div>
        </Link>

        {/* Verify Email Card */}
        <div className="card">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 text-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
              <p className="text-text-secondary">
                Check your email for the verification token
              </p>
            </div>
          </div>

          {/* Email Display */}
          {email && (
            <div className="mb-6 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-text-muted mr-3" />
                <div>
                  <p className="text-sm text-text-secondary">Verification sent to</p>
                  <p className="text-white font-medium">{email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
            <h3 className="text-white font-semibold mb-2">How to verify:</h3>
            <ol className="text-sm text-text-secondary space-y-2 list-decimal pl-4">
              <li>Check your email for a message from Meckury Pro</li>
              <li>Find the verification token (looks like a long code)</li>
              <li>Copy the entire token and paste it below</li>
              <li>Alternatively, click the confirmation link in the email</li>
            </ol>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            {/* Token Input */}
            <div>
              <label
                htmlFor="token"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Verification Token
              </label>
              <div className="relative">
                <input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="input pr-12"
                  placeholder="Paste your verification token here"
                  required
                />
                {token && (
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-meckury-primary transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center"
            >
              {loading ? <div className="spinner"></div> : 'Verify Email'}
            </button>
          </form>

          {/* Resend Verification */}
          <div className="mt-6 pt-6 border-t border-meckury-mediumGray">
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-3">
                Didn't receive the email or token expired?
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading || countdown > 0}
                className="text-sm text-meckury-primary hover:text-meckury-accent disabled:text-text-muted disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
              >
                {resendLoading ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-6 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-white">Important:</span>
              <br />
              • Check your spam/junk folder
              <br />
              • Make sure you entered the correct email address
              <br />
              • The token expires after a certain time
            </p>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary">
              Already verified?{' '}
              <Link
                href="/auth/signin"
                className="text-meckury-primary hover:text-meckury-accent font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-text-secondary hover:text-white transition-colors text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
