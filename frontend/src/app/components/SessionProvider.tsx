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

  // Background subscription check (silent)
  const checkSubscription = async () => {
    if (
      status !== "authenticated" ||
      !session?.user?.id ||
      pathname === "/" // skip on landing page
    ) {
      setShowPaywall(false);
      setShowPricingModal(false);
      return;
    }

    try {
      const res = await fetch(`/api/subscription/status?userId=${session.user.id}`, {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch subscription status");
      const data = await res.json();
      const hasActive = !!data?.hasActiveSubscription;

      if (pathname.startsWith("/tge")) {
        // Show pricing modal first if user has no active subscription
        if (!hasActive) {
          setShowPricingModal(true);
          setShowPaywall(false);
        } else {
          setShowPaywall(false);
          setShowPricingModal(false);
        }
      } else {
        setShowPaywall(false);
        setShowPricingModal(false);
      }
    } catch (err) {
      console.error("Subscription check error:", err);
      setShowPricingModal(true);
    }
  };

  // Run check in background whenever path, session, or auth status changes
  useEffect(() => {
    if (status === "loading") return;
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
    // If user closes modal, show paywall as fallback
    setShowPaywall(true);
  };

  const shouldShowPaywall = showPaywall && !showPricingModal;

  return (
    <>
      {/* Pricing Modal first */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={handlePricingModalClose}
        withBlur
      />

      {/* Paywall (fallback if modal closed) */}
      {shouldShowPaywall && <Paywall onSubscribe={handleSubscribe} />}

      {/* App content */}
      {children}
    </>
  );
}
