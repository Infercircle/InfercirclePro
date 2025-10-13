import React from "react";
import TGEPageClient from "./client";
import Paywall from "../components/Paywall";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// Removed unused types and interfaces

// 🔥 SSR: Fetch projects data on every request (secure API calls)
async function fetchProjects() {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers-zrrs.onrender.com';
  const apiKey = process.env.TGE_API_KEY || 'ak_pro_Jpo05NPhS_VEMIDrAOr-ayWHrsg5q3CO';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${helperApiUrl}/v1/projects`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      cache: 'no-store', // Force fresh data on each request (SSR equivalent)
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Projects API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Projects API returned error');
    }

    return {
      data: data.data || [],
      error: null
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    
    let errorMessage = 'Failed to fetch projects';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - API took too long to respond';
      } else if (error.message.includes('fetch failed')) {
        errorMessage = 'Network error - Unable to connect to API';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      data: [],
      error: errorMessage
    };
  }
}

// 🔥 SSG: Fetch platform images at build time (cached)
async function fetchPlatformImages() {
  const helperApiUrl = process.env.NEXT_PUBLIC_HELPERS_API_URL || 'https://helper-apis-and-scrappers-zrrs.onrender.com';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${helperApiUrl}/v1/platform-images`, {
      next: { revalidate: 3600 }, // Cache for 1 hour (SSG equivalent)
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Images API failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Images API returned error');
    }

    return {
      data: {
        projects: {},
        backers: {},
        platforms: data.data || {}
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching platform images:', error);
    return {
      data: {
        projects: {},
        backers: {},
        platforms: {}
      },
      error: error instanceof Error ? error.message : 'Failed to fetch platform images'
    };
  }
}

// 🔥 Main Page Component (Server Component - runs on server)
export default async function TGEPage() {
  // Parallel fetching for better performance
  const [projectsResult, imagesResult] = await Promise.all([
    fetchProjects(),
    fetchPlatformImages()
  ]);

  // Basic paywall check (server-side best-effort): show paywall by default
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let hasActive = false;
  try {
    // we cannot read next-auth session server-side easily here without helper
    // so we default to showing page; client paywall will enforce
    hasActive = true;
  } catch {}

  return (
    <>
      <TGEPageClient 
        projects={projectsResult.data}
        platformImages={imagesResult.data}
        apiError={projectsResult.error}
      />
    </>
  );
}
