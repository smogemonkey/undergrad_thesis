import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import React from 'react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  title: 'VulnView - SBOM Analysis Platform',
  description: 'Analyze and manage your software bill of materials with AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    )
  } catch (error) {
    console.error("Error in RootLayout:", error);
    // You could render a fallback UI here in production
    return (
      <html>
        <body>
          <h1>Error loading application</h1>
          <p>An error occurred while loading the application. Please try again later.</p>
        </body>
      </html>
    );
  }
} 