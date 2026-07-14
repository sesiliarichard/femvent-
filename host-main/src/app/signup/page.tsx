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

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Validation states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Auto-rotate slideshow every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Validation functions
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError('');
      return true;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError('');
    return true;
  };

  const validateName = (name: string) => {
    if (!name) {
      setNameError('');
      return true;
    }

    if (name.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }

    setNameError('');
    return true;
  };

  const validatePasswordStrength = () => {
    if (!password) {
      setPasswordError('');
      return true;
    }
    
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const validatePasswordMatch = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('');
      return true;
    }
    
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    } else {
      setConfirmPasswordError('');
      return true;
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text && !emailRegex.test(text)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (text && text.length < 2) {
      setNameError('Name must be at least 2 characters');
    } else {
      setNameError('');
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (text && text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (text && password && text !== password) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if all fields are filled
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    // Validate all fields
    const isEmailValid = validateEmail(email);
    const isNameValid = validateName(name);
    const isPasswordValid = validatePasswordStrength();
    const isConfirmPasswordValid = validatePasswordMatch();

    if (!isEmailValid || !isNameValid || !isPasswordValid || !isConfirmPasswordValid) {
      setError('Please fix the errors above before creating your account');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      router.push('/dashboard');
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
          <p className="text-2xl text-white/95 mb-8 text-center drop-shadow-md">Join Our Community</p>
          <p className="text-lg text-white/90 text-center max-w-md drop-shadow-md">
            Create amazing events and build your community. Start your journey as a host today.
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

      {/* Right Side - Signup Form */}
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
              Create Account
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Join the FemVents community
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
              Create Account
            </span>
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Join the FemVents community
          </p>
        </div>
        
        {/* Card */}
        <div className="border border-gray-200/30 bg-white/60 backdrop-blur-xl shadow-2xl shadow-black/20 rounded-lg p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name Input */}
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
            </div>

            {/* Email Input */}
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
              {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
            </div>

            {/* Password Input with Eye Icon */}
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
            </div>

            {/* Confirm Password Input with Eye Icon */}
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {confirmPasswordError && <p className="mt-1 text-xs text-red-600">{confirmPasswordError}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-purple-600 via-rose-500 to-orange-400 hover:from-purple-700 hover:via-rose-600 hover:to-orange-500 shadow-lg shadow-purple-600/25 transition-all duration-300 hover:shadow-purple-600/40 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
            </div>

            {/* Already have account - Sign In button */}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Already have an account? Sign In
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
