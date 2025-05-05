import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This is a simplified middleware for demo purposes
// In a real application, you would check for a valid session/token
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/signup"

  // Check if the user is authenticated (this is a simplified check)
  // In a real app, you would verify a token or session cookie
  const isAuthenticated = request.cookies.has("auth-token")

  // If the user is not authenticated and the path is not public, redirect to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the user is authenticated and trying to access login/signup, redirect to home
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Otherwise, continue with the request
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/", "/profile", "/components/:path*", "/login", "/signup"],
}
