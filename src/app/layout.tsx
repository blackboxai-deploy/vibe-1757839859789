import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Carrom Game - AI Assistant Pro',
  description: 'Professional Carrom game with advanced AI assistance, auto-aim, trajectory visualization, and auto-play features. Master your Carrom skills with intelligent gameplay assistance.',
  keywords: ['carrom', 'game', 'AI', 'assistant', 'auto-aim', 'trajectory', 'carrom board', 'online game'],
  authors: [{ name: 'Carrom AI Pro Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#8B4513',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} min-h-full bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-gradient-to-r from-amber-800 via-orange-700 to-red-800 text-white shadow-xl">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-amber-400"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Carrom AI Pro</h1>
                    <p className="text-sm text-orange-100">Advanced AI Assistant</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="hidden md:flex items-center space-x-2 text-sm">
                    <span className="px-3 py-1 bg-white/10 rounded-full">🎯 Auto-Aim</span>
                    <span className="px-3 py-1 bg-white/10 rounded-full">🤖 AI Assistant</span>
                    <span className="px-3 py-1 bg-white/10 rounded-full">📊 Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          
          <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 mt-auto">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm text-gray-300">
                    © 2024 Carrom AI Pro. Advanced gameplay assistance for Carrom enthusiasts.
                  </p>
                </div>
                <div className="flex space-x-6 text-sm text-gray-400">
                  <span>AI-Powered Gaming</span>
                  <span>•</span>
                  <span>Auto-Play Technology</span>
                  <span>•</span>
                  <span>Trajectory Analysis</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}