"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import PricingModal from "./components/PricingModal";
import { FcGoogle } from "react-icons/fc";

export default function Home() {
  const { data: session, status } = useSession();
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Mock images array
  const mockImages = [
    {
      src: "/mock.png",
      alt: "InferCircle Pro Dashboard - Real-time Crypto Lead Analytics",
      title: "Real Time Analytics Dashboard"
    },
    {
      src: "/mock2.png", // Add your second image
      alt: "InferCircle Pro Reports - Comprehensive Lead Reports",
      title: "Detailed About Pages"
    },
    {
      src: "/mock3.png", // Add your third image
      alt: "InferCircle Pro Advanced Filters",
      title: "Advanced Filters"
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % mockImages.length);
      }, 4000); // Change slide every 4 seconds

      return () => clearInterval(interval);
    }
  }, [isPaused, mockImages.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };
  
  return (
    <div className="min-h-[calc(100vh-5rem)] relative overflow-hidden">
      {/* SVG Background */}
      <div className="bg-svg-container">
        <Image
          src="/bgimage.svg"
          alt="Background pattern"
          fill 
          priority
        />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10 px-4 sm:px-6 lg:px-8">

        {/* Hero Section */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-16 items-center w-full py-10 lg:py-20 min-h-[calc(100vh-8rem)] justify-center">
          {/* Left column */}
          <div className="lg:col-span-6 space-y-6 lg:space-y-8 w-full max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
            {/* Enhanced Headline */}
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 mb-6">
                <span className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></span>
                <span className="text-xs text-white-300">
                  Discover Campaigns Across All InfoFi Platorms
                </span>
              </div>
              
              <h1
                className="leading-tight mb-6 text-white font-bold"
                style={{
                  fontSize: "clamp(32px, 5.5vw, 68px)",
                  textShadow: "0 4px 20px rgba(167, 111, 255, 0.3)"
                }}
              >
                Find High-Intent
                <br />
                <span className="text-[#a56fff] relative font-bold">
                  Crypto Leads
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-60"></div>
                </span>
                <br />
                Instantly
              </h1>
            </div>

            {/* Enhanced Value Proposition */}
            <p className="text-neutral-300 text-base lg:text-lg leading-relaxed">
              Stop wasting time on cold outreach. Our AI-powered platform identifies, 
              analyzes, and converts crypto project leads with <span className="text-white font-medium">90% higher engagement rates</span>.
            </p>

            {/* Key Benefits */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 lg:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-neutral-300">Real-time Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-neutral-300">Advanced Filtering</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                <span className="text-sm text-neutral-300">Saved Research Time</span>
              </div>
            </div>

            {/* Enhanced CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto justify-center lg:justify-start">
              <button
                onClick={() => setIsPricingOpen(true)}
                className="group relative flex items-center justify-center rounded-xl px-6 py-4 text-base font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer w-full sm:w-auto"
              >
                <span>Get Started</span>
                <span className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              <button
                onClick={() => {
                  if (session) {
                    // If user has session, redirect to /tge
                    window.location.href = '/tge';
                  } else {
                    // If no session, sign in with Google
                    signIn('google');
                  }
                }}
                className="group flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-black bg-white transition-all duration-300 shadow-lg hover:shadow-1xl cursor-pointer font-bold w-full sm:w-auto hover:shadow-purple-200"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center">
                  <FcGoogle />
                </span>
                <span>{session ? 'Go to Dashboard' : 'Continue with Google'}</span>
              </button>
            </div>

            {/* Enhanced Bottom Text with Social Proof */}
            {/* <div className="text-center lg:text-left">
              <div className="text-sm text-neutral-400" style={{ fontFamily: "Satoshi-Regular" }}>
                Have an Invite Code? <a href="#signup" className="text-[#b682ff] hover:text-purple-400 underline underline-offset-2 transition-colors cursor-pointer">Sign Up Here</a>
              </div>
            </div> */}
          </div>

          {/* Right column - Enhanced Auto-sliding Mock images */}
          <div className="hidden lg:flex lg:col-span-6 justify-center lg:justify-end">
            <div className="relative w-full max-w-4xl">
              {/* Glow effect behind the dashboard */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl blur-xl scale-105"></div>
              
              <div 
                className="relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Slider Container */}
                <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                  >
                    {mockImages.map((image, index) => (
                      <div key={index} className="w-full flex-shrink-0">
                        <Image
                          src={image.src}
                          alt={image.alt}
                          width={2000}
                          height={1200}
                          priority={index === 0}
                          className="h-auto w-[900px] sm:w-[1100px] lg:w-[1300px] xl:w-[1500px] 2xl:w-[1700px] hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Navigation Arrows */}
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + mockImages.length) % mockImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white hover:text-purple-400 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:opacity-100"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % mockImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center text-white hover:text-purple-400 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:opacity-100"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                
                {/* Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {mockImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide
                          ? 'bg-purple-500 scale-110'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    >
                      {index === currentSlide && !isPaused && (
                        <div
                          className="absolute inset-0 rounded-full bg-purple-400 origin-center animate-ping"
                          style={{
                            animation: 'progress 4s linear infinite'
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Slide Title */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1">
                  <span className="text-sm text-white font-medium">
                    {mockImages[currentSlide].title}
                  </span>
                </div>

                {/* Pause/Play Indicator */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-400' : 'bg-green-400'} animate-pulse`}></div>
                  {/* <span className="text-xs text-white">
                    {isPaused ? 'Paused' : 'Auto'}
                  </span> */}
                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 rounded-b-2xl overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ${
                      isPaused ? 'animate-none' : ''
                    }`}
                    style={{
                      width: `${((currentSlide + 1) / mockImages.length) * 100}%`,
                      animation: isPaused ? 'none' : `slideProgress 4s linear infinite`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes progress {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        
        @keyframes slideProgress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
        
        .group:hover .opacity-0 {
          opacity: 1;
        }
      `}</style>
      
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </div>
  );
}
