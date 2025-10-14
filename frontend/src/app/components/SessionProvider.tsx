"use client"

import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react"
import { ReactNode, useEffect, useState } from "react"
import Paywall from "./Paywall"
import PricingModal from "./PricingModal"

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>
    <PaywallController>
      {children}
    </PaywallController>
  </NextAuthSessionProvider>
}

function PaywallController({ children }: { children: ReactNode }){
  const { data: session, status } = useSession();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);

  // Force subscription check on every render for /tge pages
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const path = window.location.pathname;
    console.log('SessionProvider - FORCE CHECK:', path, 'status:', status, 'session:', !!session);
    
    // Only check on /tge routes
    if (!path.startsWith('/tge')) {
      setShowPaywall(false);
      setShowPricingModal(false);
      setIsLoadingSubscription(false);
      return;
    }

    // Only check if authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      setShowPaywall(false);
      setShowPricingModal(false);
      setIsLoadingSubscription(false);
      return;
    }

    // FORCE subscription check every time
    const forceCheck = async () => {
      console.log('SessionProvider - FORCING subscription check for user:', session.user.id);
      setIsLoadingSubscription(true);

      try {
        const res = await fetch(`/api/subscription/status?userId=${session.user.id}`, { cache: 'no-store' });
        const js = await res.json();
        const hasActive = js?.hasActiveSubscription;
        console.log('SessionProvider - FORCED result:', { hasActive, js });

        if (!hasActive) {
          console.log('SessionProvider - FORCED: No subscription, showing paywall');
          setShowPaywall(true);
          setShowPricingModal(false);
        } else {
          console.log('SessionProvider - FORCED: Has subscription, showing dashboard');
          setShowPaywall(false);
          setShowPricingModal(false);
        }
      } catch (error) {
        console.error('SessionProvider - FORCED error:', error);
        setShowPaywall(true);
        setShowPricingModal(false);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    // Add a small delay to ensure client-side rendering is complete
    const timeoutId = setTimeout(forceCheck, 100);
    
    return () => clearTimeout(timeoutId);
  }, [session?.user?.id, status]);

  const handleSubscribe = () => {
    setShowPricingModal(true);
    setShowPaywall(false); // Hide paywall when showing pricing modal
  };

  const handlePricingModalClose = () => {
    setShowPricingModal(false);
    setShowPaywall(true); // Show paywall again after closing pricing modal
  };

  // Additional effect to handle route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleRouteChange = () => {
      const path = window.location.pathname;
      console.log('SessionProvider - Route change detected:', path);
      
      if (path.startsWith('/tge') && status === 'authenticated' && session?.user?.id) {
        // Force a subscription check on route change
        const forceCheck = async () => {
          console.log('SessionProvider - Route change: FORCING subscription check');
          setIsLoadingSubscription(true);

          try {
            const res = await fetch(`/api/subscription/status?userId=${session.user.id}`, { cache: 'no-store' });
            const js = await res.json();
            const hasActive = js?.hasActiveSubscription;
            console.log('SessionProvider - Route change result:', { hasActive, js });

            if (!hasActive) {
              console.log('SessionProvider - Route change: No subscription, showing paywall');
              setShowPaywall(true);
              setShowPricingModal(false);
            } else {
              console.log('SessionProvider - Route change: Has subscription, showing dashboard');
              setShowPaywall(false);
              setShowPricingModal(false);
            }
          } catch (error) {
            console.error('SessionProvider - Route change error:', error);
            setShowPaywall(true);
            setShowPricingModal(false);
          } finally {
            setIsLoadingSubscription(false);
          }
        };

        forceCheck();
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    // Also check immediately
    handleRouteChange();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [session?.user?.id, status]);

  // Additional effect to force check on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const path = window.location.pathname;
    console.log('SessionProvider - MOUNT CHECK:', path, 'status:', status, 'session:', !!session);
    
    if (path.startsWith('/tge') && status === 'authenticated' && session?.user?.id) {
      console.log('SessionProvider - MOUNT: Starting subscription check');
      setIsLoadingSubscription(true);
      
      const checkSubscription = async () => {
        try {
          const res = await fetch(`/api/subscription/status?userId=${session.user.id}`, { cache: 'no-store' });
          const js = await res.json();
          const hasActive = js?.hasActiveSubscription;
          console.log('SessionProvider - MOUNT result:', { hasActive, js });

          if (!hasActive) {
            console.log('SessionProvider - MOUNT: No subscription, showing paywall');
            setShowPaywall(true);
            setShowPricingModal(false);
          } else {
            console.log('SessionProvider - MOUNT: Has subscription, showing dashboard');
            setShowPaywall(false);
            setShowPricingModal(false);
          }
        } catch (error) {
          console.error('SessionProvider - MOUNT error:', error);
          setShowPaywall(true);
          setShowPricingModal(false);
        } finally {
          setIsLoadingSubscription(false);
        }
      };

      checkSubscription();
    }
  }, []); // Run only on mount

  // Simple render logic
  const shouldShowPaywall = showPaywall && !showPricingModal;
  const shouldShowLoading = isLoadingSubscription;

  console.log('SessionProvider - Render state:', {
    showPaywall,
    isLoadingSubscription,
    showPricingModal,
    shouldShowPaywall,
    shouldShowLoading,
    path: typeof window !== 'undefined' ? window.location.pathname : 'server'
  });

  return <>
    {shouldShowLoading && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md">
        <div className="bg-[#151820] border border-[#23272b] rounded-xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Verifying Subscription Status</h2>
          <p className="text-gray-400">Please wait while we check your access...</p>
        </div>
      </div>
    )}
    {shouldShowPaywall && <Paywall onSubscribe={handleSubscribe} />}
    <PricingModal 
      isOpen={showPricingModal} 
      onClose={handlePricingModalClose}
      withBlur={true}
    />
    {children}
  </>
}
