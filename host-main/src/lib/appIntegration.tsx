/**
 * App-wide Integration File
 * 
 * Add this to your main app component (wherever it is located)
 * This integrates the LiveChatWidget globally
 */

import LiveChatWidget from '@/components/LiveChatWidget';

// If using Next.js App Router (app/layout.tsx), add this to your RootLayout:
export function RootLayoutWithChat({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <LiveChatWidget />
        </>
    );
}

// If using Next.js Pages Router (pages/_app.tsx), use this:
export function AppWithChat({ Component, pageProps }: any) {
    return (
        <>
            <Component {...pageProps} />
            <LiveChatWidget />
        </>
    );
}

// Export whichever one you need for your setup
