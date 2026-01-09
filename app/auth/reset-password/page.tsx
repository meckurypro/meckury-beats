// app/auth/reset-password/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Check if we're in reset mode (has token in URL)
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  
  // If token is present, switch to reset step
  useState(() => {
    if (token && type === 'recovery') {
      setStep('reset')
    }
  })

  // Handle request reset link
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      setResetSent(true)
      toast.success('Password reset link sent! Check your email.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // First verify the token exists
      const { error: tokenError } = await supabase.auth.verifyOtp({
        token: token!,
        type: 'recovery',
        email: formData.email,
      })

      if (tokenError) throw tokenError

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      })

      if (updateError) throw updateError

      toast.success('Password updated successfully! You can now sign in.')
      router.push('/auth/signin')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
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

        {/* Reset Password Card */}
        <div className="card">
          <div className="flex items-center mb-6">
            <button
              onClick={() => step === 'reset' && token ? setStep('request') : router.back()}
              className="mr-4 text-text-secondary hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {step === 'request' ? 'Reset Password' : 'Set New Password'}
              </h1>
              <p className="text-text-secondary">
                {step === 'request' 
                  ? 'Enter your email to receive a reset link'
                  : 'Create a new password for your account'
                }
              </p>
            </div>
          </div>

          {step === 'request' ? (
            /* Request Reset Form */
            <form onSubmit={handleRequestReset} className="space-y-6">
              {resetSent ? (
                /* Success Message */
                <div className="p-4 bg-meckury-success/10 border border-meckury-success/30 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-meckury-success mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium mb-1">Check Your Email</p>
                      <p className="text-sm text-text-secondary">
                        We've sent a password reset link to <span className="text-white">{formData.email}</span>. 
                        Click the link in the email to create a new password.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Email Input */
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-text-secondary mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input pl-12"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || resetSent}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <div className="spinner"></div>
                ) : resetSent ? (
                  'Link Sent'
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Help Text */}
              <div className="mt-4 p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
                <p className="text-sm text-text-secondary">
                  <span className="font-semibold text-white">Important:</span>
                  <br />
                  • Check your spam/junk folder if you don't see the email
                  <br />
                  • The reset link expires after 24 hours
                  <br />
                  • You can request a new link if needed
                </p>
              </div>
            </form>
          ) : (
            /* Reset Password Form */
            <form onSubmit={handleResetPassword} className="space-y-6">
              {token && (
                <div className="p-4 bg-meckury-primary/10 border border-meckury-primary/30 rounded-lg">
                  <p className="text-sm text-text-secondary">
                    <span className="font-semibold text-white">Reset Link Verified</span>
                    <br />
                    You can now set a new password for your account.
                  </p>
                </div>
              )}

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="input pl-12 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  Must be at least 6 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmNewPassword"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
                  <input
                    id="confirmNewPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="input pl-12"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Password Requirements */}
              <div className="p-4 bg-background-elevated rounded-lg border border-meckury-mediumGray">
                <p className="text-sm font-medium text-white mb-2">Password Requirements:</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${formData.password.length >= 6 ? 'bg-meckury-success' : 'bg-meckury-mediumGray'}`}></div>
                    At least 6 characters
                  </li>
                  <li className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[A-Z]/.test(formData.password) ? 'bg-meckury-success' : 'bg-meckury-mediumGray'}`}></div>
                    One uppercase letter
                  </li>
                  <li className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${/[a-z]/.test(formData.password) ? 'bg-meckury-success' : 'bg-meckury-mediumGray'}`}></div>
                    One lowercase letter
                  </li>
                  <li className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${/\d/.test(formData.password) ? 'bg-meckury-success' : 'bg-meckury-mediumGray'}`}></div>
                    One number
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? <div className="spinner"></div> : 'Update Password'}
              </button>
            </form>
          )}

          {/* Back to Sign In Link */}
          <div className="mt-6 pt-6 border-t border-meckury-mediumGray text-center">
            <p className="text-text-secondary">
              Remember your password?{' '}
              <Link
                href="/auth/signin"
                className="text-meckury-primary hover:text-meckury-accent font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Create Account Link */}
          <div className="mt-4 text-center">
            <p className="text-text-secondary">
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-meckury-primary hover:text-meckury-accent font-semibold transition-colors"
              >
                Sign Up
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
