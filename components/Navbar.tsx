'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CartButton from '@/components/CartButton'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdminStatus(session.user.id)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        checkAdminStatus(session.user.id)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    setIsAdmin(data?.is_admin || false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/beats', label: 'Beats' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/studio', label: 'Book Session' },
    { href: '/about', label: 'About' },
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 transition-all duration-300 ${
          isScrolled
            ? 'bg-background-card shadow-lg backdrop-blur-md bg-opacity-95'
            : 'bg-transparent'
        }`}
        style={{ zIndex: 9999 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="text-2xl sm:text-3xl font-display font-bold">
                <span className="text-meckury-primary group-hover:text-meckury-accent transition-colors">
                  Meckury
                </span>
                <span className="text-white ml-2">Pro</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-meckury-primary'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart Button */}
              <div style={{ zIndex: 10000 }}>
                <CartButton />
              </div>
              
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="p-2 text-text-secondary hover:text-meckury-primary transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="p-2 text-text-secondary hover:text-meckury-primary transition-colors"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-text-secondary hover:text-meckury-danger transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-text-secondary hover:text-white font-medium transition-colors"
                  >
                    Sign In
                </Link>
                  <Link href="/auth/signup" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-white transition-colors"
              style={{ zIndex: 10000 }}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            className="md:hidden bg-background-card border-t border-meckury-mediumGray animate-slide-down"
            style={{ zIndex: 9998 }}
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-2 font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-meckury-primary'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-meckury-mediumGray space-y-4">
                {/* Mobile Cart Button */}
                <div className="relative" style={{ zIndex: 9999 }}>
                  <Link
                    href="/cart"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 py-2 text-text-secondary hover:text-white transition-colors"
                  >
                    <div className="relative">
                      <span className="absolute -top-1 -right-1 bg-meckury-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        0 {/* You can make this dynamic later */}
                      </span>
                    </div>
                    <span>Cart</span>
                  </Link>
                </div>
                
                {user ? (
                  <>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-2 py-2 text-text-secondary hover:text-white transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Admin</span>
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 py-2 text-text-secondary hover:text-white transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span>My Account</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 py-2 text-meckury-danger hover:text-red-400 transition-colors w-full"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signin"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 text-text-secondary hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="block btn-primary text-center"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding under navbar */}
      <div className="h-20"></div>
    </>
  )
}
