import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shajaraviy Web',
  description: 'Familya shajarasi - animatsiyali web sayt',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz">
      <body className="overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
