/**
 * FEATURE 12: Live Chat Support Integration
 * 
 * This is a simple integration with a third-party chat provider.
 * Options: Tawk.to (free), Intercom, Crisp, or Zendesk
 * 
 * Recommendation: Tawk.to for simplicity and cost-effectiveness
 * 
 * Setup:
 * 1. Sign up at https://www.tawk.to
 * 2. Get your Widget ID
 * 3. Add to .env: NEXT_PUBLIC_TAWK_WIDGET_ID=your_widget_id
 * 4. Add this component to _app.tsx
 */

import { useEffect } from 'react';

export default function LiveChatWidget() {
    useEffect(() => {
        const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;

        if (!widgetId) {
            console.warn('Tawk.to widget ID not configured');
            return;
        }

        // Load Tawk.to script
        var Tawk_API = (window as any).Tawk_API || {};
        var Tawk_LoadStart = new Date();

        (function () {
            var s1 = document.createElement('script');
            var s0 = document.getElementsByTagName('script')[0];
            s1.async = true;
            s1.src = `https://embed.tawk.to/${widgetId}/default`;
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');
            s0.parentNode?.insertBefore(s1, s0);
        })();

        // Customize widget
        Tawk_API.onLoad = function () {
            console.log('Live chat loaded');

            // You can customize the chat widget here
            // Example: Hide widget on certain pages
            // if (window.location.pathname === '/checkout') {
            //   Tawk_API.hideWidget();
            // }
        };

        // Track when chat is opened
        Tawk_API.onChatStarted = function () {
            // Analytics tracking
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'chat_started', {
                    event_category: 'engagement',
                    event_label: 'Live Chat'
                });
            }
        };

    }, []);

    return null; // This component doesn't render anything
}

/**
 * Alternative: Intercom Integration
 * 
 * For premium support features, use Intercom:
 * 
 * 1. Sign up at https://www.intercom.com
 * 2. Get your App ID
 * 3. Use this code instead:
 */

export function IntercomWidget() {
    useEffect(() => {
        const appId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

        if (!appId) return;

        (function () {
            var w = window as any;
            var ic = w.Intercom;
            if (typeof ic === 'function') {
                ic('reattach_activator');
                ic('update', w.intercomSettings);
            } else {
                var d = document;
                var i = function (...args: any[]) {
                    i.c(args);
                } as any;
                i.q = [];
                i.c = function (args: any) {
                    i.q.push(args);
                };
                w.Intercom = i;

                var l = function () {
                    var s = d.createElement('script');
                    s.type = 'text/javascript';
                    s.async = true;
                    s.src = `https://widget.intercom.io/widget/${appId}`;
                    var x = d.getElementsByTagName('script')[0];
                    x.parentNode?.insertBefore(s, x);
                };

                if (document.readyState === 'complete') {
                    l();
                } else if (w.attachEvent) {
                    w.attachEvent('onload', l);
                } else {
                    w.addEventListener('load', l, false);
                }
            }
        })();

        // Initialize Intercom
        (window as any).Intercom('boot', {
            app_id: appId,
            // You can pass user data here:
            // user_id: currentUser?.id,
            // name: currentUser?.name,
            // email: currentUser?.email,
        });

    }, []);

    return null;
}

/**
 * Usage in _app.tsx:
 * 
 * import LiveChatWidget from '@/components/LiveChatWidget';
 * 
 * function MyApp({ Component, pageProps }) {
 *   return (
 *     <>
 *       <Component {...pageProps} />
 *       <LiveChatWidget />
 *     </>
 *   );
 * }
 */
