"use client";

import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Paywall from "./Paywall";
import PricingModal from "./PricingModal";

interface SessionProviderProps {
  children: ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      <PaywallController>{children}</PaywallController>
    </NextAuthSessionProvider>
  );
}

function PaywallController({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const [showPaywall, setShowPaywall] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);

  // Centralized subscription check
  const checkSubscription = async () => {
    // Skip check for unauthenticated users or non-/tge routes
    if (
      status !== "authenticated" ||
      !session?.user?.id ||
      pathname === "/" // skip on landing page
    ) {
      setShowPaywall(false);
      setShowPricingModal(false);
      setIsLoadingSubscription(false);
      return;
    }

    setIsLoadingSubscription(true);
    try {
      const res = await fetch(`/api/subscription/status?userId=${session.user.id}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch subscription status");
      const data = await res.json();
      const hasActive = !!data?.hasActiveSubscription;

      if (pathname.startsWith("/tge")) {
        setShowPaywall(!hasActive);
      } else {
        setShowPaywall(false);
      }

      setShowPricingModal(false);
    } catch (err) {
      console.error("Subscription check error:", err);
      setShowPaywall(true);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  // Run check when path, session, or auth status changes
  useEffect(() => {
    if (status === "loading") return; // skip while loading session
    checkSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, session?.user?.id, status]);

  // Modal handlers
  const handleSubscribe = () => {
    setShowPricingModal(true);
    setShowPaywall(false);
  };

  const handlePricingModalClose = () => {
    setShowPricingModal(false);
    setShowPaywall(true);
  };

  const shouldShowPaywall = showPaywall && !showPricingModal;

  return (
    <>
      {/* Loader */}
      {isLoadingSubscription && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-[#151820] border border-[#23272b] rounded-xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Verifying Subscription Status</h2>
            <p className="text-gray-400">Please wait while we check your access...</p>
          </div>
        </div>
      )}

      {/* Paywall */}
      {shouldShowPaywall && <Paywall onSubscribe={handleSubscribe} />}

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={handlePricingModalClose}
        withBlur
      />

      {/* App content */}
      {children}
    </>
  );
}
