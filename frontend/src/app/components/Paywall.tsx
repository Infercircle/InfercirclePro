"use client";

import React from "react";

interface PaywallProps {
  onSubscribe: () => void;
}

export default function Paywall({ onSubscribe }: PaywallProps) {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 backdrop-blur-md bg-black/70 pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto bg-[#111318] border border-[#2a2e35] rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Please subscribe to unlock full access</h2>
          <p className="text-gray-400 text-sm text-center mb-6">Gain access to premium data, analytics and more.</p>
          <div className="flex gap-3">
            <button
              onClick={onSubscribe}
              className="flex-1 text-center bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
            >
              View Plans
            </button>
            <a
              href="https://t.me/GizmoBrymez"
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}


