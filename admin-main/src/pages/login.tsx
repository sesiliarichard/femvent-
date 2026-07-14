import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  // Auto-rotate slideshow every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password);
      router.push('/');
    } catch (error: any) {
      alert('Signup failed: ' + error.message);
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
          <p className="text-2xl text-white/95 mb-8 text-center drop-shadow-md">Admin Management System</p>
          <p className="text-lg text-white/90 text-center max-w-md drop-shadow-md">
            Empowering women through events. Manage your entire events platform from one place.
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
          {/* Logo for mobile only */}
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
                Admin Dashboard
              </span>
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              FemVents Events Management
            </p>
          </div>

          {/* Logo for desktop (Right Side) */}
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
                Admin Dashboard
              </span>
            </h1>
            <p className="text-sm text-gray-600 mt-2">
              FemVents Events Management
            </p>
          </div>

        <div className="border border-gray-200/30 bg-white/60 backdrop-blur-xl shadow-2xl shadow-black/20 rounded-2xl">
          <div className="space-y-1 pb-4 pt-6 px-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-center lg:text-left text-gray-900">
              Welcome back
            </h2>
            <p className="text-center lg:text-left text-sm text-gray-600">
              Enter your credentials to access admin portal
            </p>
          </div>

          <div className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="admin@example.com"
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
