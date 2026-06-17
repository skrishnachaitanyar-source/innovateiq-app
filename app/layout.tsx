import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Innovate IQ LLC | Contract Staffing & Placement',
  description: 'Innovate IQ LLC — Contract staffing and placement solutions. Connecting skilled professionals with contract opportunities via 1099, W-2, or C2C.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
