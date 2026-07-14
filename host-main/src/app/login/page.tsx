'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

// Impressive event images for slideshow
const slideshowImages = [
  '/slideshow/event1.jpg',
  '/slideshow/event2.jpg',
  '/slideshow/event3.jpg',
  '/slideshow/event4.jpg',
  '/slideshow/event5.jpg',
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { signIn, signInWithGoogle, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Auto-rotate slideshow every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      
      // Wait for AuthContext to refresh userProfile (it may be fetched asynchronously)
      const start = Date.now();
      const waitForProfile = async () => {
        while ((authLoading || !userProfile) && Date.now() - start < 5000) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 200));
        }
      };

      await waitForProfile();

      // Check if user is a host (role or approved application)
      if (userProfile?.role === 'host' || userProfile?.hostApplication?.status === 'approved') {
        router.push('/dashboard');
      } else {
        setError('Access denied. Only hosts can access this platform.');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();

      // Wait for profile to populate
      const start = Date.now();
      const waitForProfile = async () => {
        while ((authLoading || !userProfile) && Date.now() - start < 5000) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((res) => setTimeout(res, 200));
        }
      };

      await waitForProfile();

      if (userProfile?.role === 'host' || userProfile?.hostApplication?.status === 'approved') {
        router.push('/dashboard');
      } else {
        setError('Access denied. Only hosts can access this platform.');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Slideshow */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Slideshow Images */}
        {slideshowImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{
              opacity: index === currentImageIndex ? 1 : 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 via-secondary-900/70 to-accent-900/60" />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <h1 className="text-5xl font-bold mb-4 text-center drop-shadow-lg">FemVents</h1>
          <p className="text-2xl text-white/95 mb-8 text-center drop-shadow-md">Host Dashboard</p>
          <p className="text-lg text-white/90 text-center max-w-md drop-shadow-md">
            Empowering women to create amazing events. Manage your events, attendees, and grow your community.
          </p>
          
          {/* Slideshow indicators */}
          <div className="flex gap-2 mt-12">
            {slideshowImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50 relative overflow-hidden">
        {/* Subtle animated background for right side */}
        <div className="absolute top-1/4 -right-32 h-64 w-64 rounded-full bg-primary-400/5 blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 h-64 w-64 rounded-full bg-secondary-400/5 blur-3xl" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo and branding - Mobile Only */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-rose-500 to-orange-400 shadow-2xl shadow-purple-600/30 mb-5 p-1">
            <div className="bg-white rounded-xl w-full h-full flex items-center justify-center">
              <img
                src="/icon.png"
                alt="FemVents App"
                className="h-14 w-14 rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 via-rose-500 to-orange-400 bg-clip-text text-transparent">
              Host Dashboard
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            FemVents Event Management
          </p>
        </div>

        {/* Logo and branding - Desktop (Right Side) */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:mb-8">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-rose-500 to-orange-400 shadow-2xl shadow-purple-600/30 mb-5 p-1">
            <div className="bg-white rounded-xl w-full h-full flex items-center justify-center">
              <img
                src="/icon.png"
                alt="FemVents App"
                className="h-14 w-14 rounded-lg"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-600 via-rose-500 to-orange-400 bg-clip-text text-transparent">
              Host Dashboard
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            FemVents Event Management
          </p>
        </div>

        <div className="border border-gray-200/30 bg-white/60 backdrop-blur-xl shadow-2xl shadow-black/20 rounded-2xl">
          <div className="space-y-1 pb-4 pt-6 px-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-center lg:text-left text-gray-900">
              Welcome back
            </h2>
            <p className="text-center lg:text-left text-sm text-gray-600">
              Sign in to manage your events
            </p>
          </div>

          <div className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="py-2 border border-red-500/50 bg-red-50 rounded-md flex items-center gap-2 px-3">
                  <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="host@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 bg-gray-50/50 border border-gray-300/50 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-3 py-2 pr-10 bg-gray-50/50 border border-gray-300/50 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 via-rose-500 to-orange-400 hover:from-purple-700 hover:via-rose-600 hover:to-orange-500 text-white font-medium py-2 px-4 rounded-md shadow-lg shadow-purple-600/25 transition-all duration-300 hover:shadow-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>

              <div className="flex justify-between items-center mt-4 text-sm">
                <Link href="/signup" className="text-rose-600 hover:text-rose-500 font-medium">
                  Create account
                </Link>
                <button
                  type="button"
                  onClick={() => alert('Forgot password functionality')}
                  className="text-rose-600 hover:text-rose-500"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          © 2024 FemVents. Empowering Women Through Events.
        </p>
      </div>
      </div>
    </div>
  );
}



