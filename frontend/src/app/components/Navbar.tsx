"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  // Get user initials for fallback avatar
  const getUserInitial = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? "bg-black backdrop-blur-md"
          : "bg-transparent"
      }`}
      style={{
        borderBottomColor: "#23272b",
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <img
                src="/inferpro.svg"
                alt="Infercircle Logo"
                className="h-6 md:h-8 w-auto"
              />
            </div>
          </Link>

          {/* User Profile Dropdown */}
          {session && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2"
                aria-label="Profile menu"
              >
                {/* Profile Button Image with Fallback */}
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-8 h-8 rounded-full cursor-pointer border-2 border-purple-500/30 hover:border-purple-400 transition-colors"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextElementSibling) {
                        (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-500/30 hover:border-purple-400 transition-colors flex items-center justify-center text-sm font-semibold text-white cursor-pointer"
                  style={{ display: session.user?.image ? 'none' : 'flex' }}
                >
                  {getUserInitial()}
                </div>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-black/95 backdrop-blur-md border border-gray-700 rounded-lg shadow-xl z-[100]">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      {/* Dropdown Profile Image with Fallback */}
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'User'}
                          className="w-12 h-12 rounded-full border-2 border-purple-500/30"
                          onError={(e) => {
                            // Fallback if image fails to load
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-500/30 flex items-center justify-center text-lg font-semibold text-white"
                        style={{ display: session.user?.image ? 'none' : 'flex' }}
                      >
                        {getUserInitial()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {session.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {session.user?.email || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <Link
                      href="/tge"
                      className="flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/50 rounded-lg transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Dashboard</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: '/' });
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
