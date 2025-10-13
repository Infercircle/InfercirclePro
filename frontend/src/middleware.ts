import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Only check authentication - subscription checks are handled client-side
    // This allows users to reach /tge to see pricing modal and paywall
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/tge/:path*',
    '/tge'
  ]
}
