import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Modal from "./Modal";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  withBlur?: boolean;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, withBlur = false }) => {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'six_months'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidationMessage, setCodeValidationMessage] = useState('');
  
  const monthlyPrice = 199;
  const sixMonthPrice = 1000; // discounted 6 months total
  const sixMonthSavings = (monthlyPrice * 6) - sixMonthPrice; // $194 savings

  const handlePayNow = async () => {
    if (!session?.user) {
      alert('Please sign in to continue with payment');
      return;
    }

    setIsProcessing(true);
    
    try {
      const amount = billingCycle === 'monthly' ? monthlyPrice : sixMonthPrice;
      
      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          billingCycle,
          currency: 'USD',
          userId: session.user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Flutterwave payment page
        window.location.href = data.payment_url;
      } else {
        const msg = data?.error || 'Payment initialization failed. Please try again.';
        alert(msg);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContactSales = () => {
    window.open("https://t.me/GizmoBrymez", "_blank");
  };

  const validateInviteCode = async () => {
    if (!inviteCode.trim()) {
      setCodeValidationMessage('');
      return;
    }

    setIsValidatingCode(true);
    setCodeValidationMessage('');

    try {
      console.log('PricingModal - Session:', session?.user?.id);
      console.log('PricingModal - Code:', inviteCode.trim());
      
      const response = await fetch('/api/invite-code/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: inviteCode.trim(),
          userId: session?.user?.id 
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeValidationMessage('✅ Invite code valid! You now have 3 days of free access.');
        // Optionally redirect to dashboard or close modal
        setTimeout(() => {
          onClose();
          window.location.href = '/tge';
        }, 2000);
      } else {
        setCodeValidationMessage(`❌ ${data.error || 'Invalid invite code'}`);
      }
    } catch (error) {
      setCodeValidationMessage('❌ Error validating invite code. Please try again.');
    } finally {
      setIsValidatingCode(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} withBlur={withBlur}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">TGE Campaign Access</h2>
          <p className="text-gray-400">Unlock exclusive campaign insights and data</p>
        </div>


        {/* Billing Toggle */}
        <div className="flex justify-center">
          <div className="bg-[#2a2e35] rounded-lg p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('six_months')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                billingCycle === 'six_months'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              6 Months
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pricing Section */}
          <div className="bg-[#1a1d23] border border-[#2a2e35] rounded-xl p-6">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {billingCycle === 'six_months' && (
                  <span className="text-lg text-gray-400 line-through">
                    ${monthlyPrice * 6}
                  </span>
                )}
                <span className="text-4xl font-bold text-white">
                  ${billingCycle === 'monthly' ? monthlyPrice : sixMonthPrice}
                </span>
                {billingCycle === 'six_months' && (
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Save ${sixMonthSavings}
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-sm">
                {billingCycle === 'monthly' ? 'per month' : 'for 6 months'}
              </div>
              {billingCycle === 'six_months' && (
                <div className="text-green-400 text-sm font-medium mt-1">
                  ${Math.round(sixMonthPrice / 6)} per month (16.25% discount)
                </div>
              )}
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Comprehensive TGE campaign database</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Real-time project tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Detailed backer and VC information</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Advanced filtering and search</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  `Pay Now - $${billingCycle === 'monthly' ? monthlyPrice : sixMonthPrice}`
                )}
              </button>
              <button
                onClick={handleContactSales}
                className="w-full bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Contact Sales
              </button>
            </div>
          </div>

          {/* API Access Section */}
          <div className="bg-[#1a1d23] border border-[#2a2e35] rounded-xl p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">API Access</h3>
              <p className="text-gray-400 text-sm">Programmatic data access</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>RESTful API endpoints</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Real-time data updates</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>High-rate limits</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Custom integrations</span>
              </div>
            </div>

            <button
              onClick={handleContactSales}
              className="w-full bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Contact Sales for API
            </button>
          </div>
        </div>

        {/* Subtle Invite Code Section */}
        <div className="pt-3 border-t border-gray-700">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-400">Invite code</span>
            <input
              type="text"
              placeholder="Enter code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && validateInviteCode()}
              className="w-21 bg-[#23272b] border border-[#2d3338] text-white placeholder-gray-500 rounded px-2 py-1 text-sm focus:outline-none"
            />
            <button
              onClick={validateInviteCode}
              disabled={!inviteCode.trim() || isValidatingCode}
              className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isValidatingCode ? '...' : 'Send'}
            </button>
          </div>
          
          {codeValidationMessage && (
            <div className={`mt-2 text-sm text-center ${codeValidationMessage.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {codeValidationMessage}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PricingModal;
    