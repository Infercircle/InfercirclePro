"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'pending'>('pending');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const verifyPayment = async () => {
      const tx_ref = searchParams.get('tx_ref');
      
      if (!tx_ref || !session?.user) {
        setVerificationStatus('error');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tx_ref }),
        });

        const data = await response.json();

        if (data.success) {
          setVerificationStatus('success');
          setIsVerifying(false);
          return;
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Don't set error status immediately, keep trying
      } finally {
        setAttempts(a => a + 1);
      }
    };

    // Only show error after 10 attempts (20 seconds)
    if (attempts >= 10) {
      setVerificationStatus('error');
      setIsVerifying(false);
      return;
    }

    const id = setInterval(verifyPayment, 2000);
    verifyPayment();
    return () => clearInterval(id);
  }, [searchParams, session, attempts]);

  if (isVerifying && verificationStatus !== 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Verifying Payment...</h2>
          <p className="text-gray-400 mb-4">Please wait while we confirm your payment</p>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((attempts / 10) * 100, 90)}%` }}
            ></div>
          </div>
          <p className="text-gray-500 text-sm">Attempt {attempts}/10</p>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-gray-400 mb-6">
            Your subscription has been activated. You now have access to our comprehensive TGE campaign database.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/tge')}
              className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Access Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Payment Failed</h1>
        <p className="text-gray-400 mb-6">
          There was an issue processing your payment. Please try again or contact support.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.open("https://t.me/GizmoBrymez", "_blank")}
            className="w-full bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
