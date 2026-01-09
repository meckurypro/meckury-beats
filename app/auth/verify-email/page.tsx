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
        } else {
          // If no session, we might need to extract email from token or URL
          const tokenFromUrl = searchParams.get('token')
          if (tokenFromUrl) {
            // Try to parse email from token if it's a confirmation link
            setToken(tokenFromUrl)
            // You might want to auto-submit if token is in URL
          }
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

    if (!email) {
      toast.error('Email is required for verification')
      return
    }

    setLoading(true)

    try {
      // IMPORTANT: For email confirmation, use type 'email' or 'signup'
      // The token from the email is actually a full URL, not just a code
      // We need to extract the token hash from the URL
      
      let tokenHash = token.trim();
      
      // If the token is a full URL (like from the email link), extract the token parameter
      if (token.includes('token=')) {
        const url = new URL(token);
        tokenHash = url.searchParams.get('token') || token;
      }
      
      // Try different verification methods
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: tokenHash,
        type: 'email'  // Changed from 'signup' to 'email'
      });

      if (error) {
        // Try with 'signup' type as fallback
        const { error: signupError } = await supabase.auth.verifyOtp({
          email,
          token: tokenHash,
          type: 'signup'
        });
        
        if (signupError) throw signupError;
      }

      toast.success('Email verified successfully! Welcome to Meckury Pro!')
      
      // Refresh session to get updated user state
      await supabase.auth.refreshSession();
      
      // Redirect to landing page
      setTimeout(() => {
        router.push('/')
      }, 1500)
      
    } catch (error: any) {
      console.error('Verification error:', error)
      
      // More specific error messages
      if (error.message.includes('token has expired')) {
        toast.error('Verification token has expired. Please request a new one.')
      } else if (error.message.includes('invalid token')) {
        toast.error('Invalid verification token. Please check and try again.')
      } else if (error.message.includes('email')) {
        toast.error('Email verification failed. Please ensure you entered the correct email.')
      } else {
        toast.error(error.message || 'Failed to verify email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (countdown > 0) return

    if (!email) {
      toast.error('Please enter your email address first')
      return
    }

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

          {/* Email Display/Input */}
          <div className="mb-6">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Your Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-12"
                placeholder="Enter the email you signed up with"
                required
              />
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Enter the email address you used to sign up
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-6 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
            <h3 className="text-white font-semibold mb-2">How to verify:</h3>
            <ol className="text-sm text-text-secondary space-y-2 list-decimal pl-4">
              <li>Check your email for a message from Meckury Pro</li>
              <li>Copy the entire verification token (or click the link)</li>
              <li>Paste the token below or enter your email if clicking the link</li>
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
              <p className="mt-1 text-xs text-text-muted">
                Paste the entire token from your email
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || !token}
              className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <div className="spinner"></div> : 'Verify Email'}
            </button>
          </form>

          {/* Alternative: Auto-verify if token is in URL */}
          {searchParams.get('token') && !token && (
            <div className="mt-4 p-4 bg-meckury-primary/10 border border-meckury-primary/30 rounded-lg">
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-white">Token detected in URL</span>
                <br />
                Enter your email above and click "Verify Email" to continue.
              </p>
            </div>
          )}

          {/* Resend Verification */}
          <div className="mt-6 pt-6 border-t border-meckury-mediumGray">
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-3">
                Didn't receive the email or token expired?
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading || countdown > 0 || !email}
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
              • The token expires after 24 hours
              <br />
              • If clicking the link doesn't work, copy and paste the token manually
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
