/**
 * EVENT PROMOTION TOOLS
 * Social media post generator, QR codes, share links
 */

import React, { useState } from 'react';
import QRCode from 'qrcode';

interface PromotionToolsProps {
    event: any;
    eventId: string;
}

const PromotionTools: React.FC<PromotionToolsProps> = ({ event, eventId }) => {
    const [qrCode, setQrCode] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'social' | 'qr' | 'embed'>('social');

    const eventUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${eventId}`;

    // Generate QR Code
    const generateQRCode = async () => {
        try {
            const qr = await QRCode.toDataURL(eventUrl, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });
            setQrCode(qr);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'qr' && !qrCode) {
            generateQRCode();
        }
    }, [activeTab]);

    // Social media templates
    const socialTemplates = {
        twitter: `🎉 Join us at ${event.title}!\n📅 ${new Date(event.startAt?.seconds * 1000).toLocaleDateString()}\n📍 ${event.venue || 'Online'}\n\n🎫 Get your tickets: ${eventUrl}\n\n#Events #${event.title.replace(/\s+/g, '')}`,
        facebook: `🎉 Exciting Event Alert!\n\n${event.title}\n\n${event.description || ''}\n\n📅 Date: ${new Date(event.startAt?.seconds * 1000).toLocaleDateString()}\n📍 Location: ${event.venue || 'Online'}\n\n🎫 Register now: ${eventUrl}`,
        linkedin: `I'm excited to invite you to ${event.title}!\n\nDate: ${new Date(event.startAt?.seconds * 1000).toLocaleDateString()}\nLocation: ${event.venue || 'Online'}\n\n${event.description || ''}\n\nRegistration: ${eventUrl}`,
        instagram: `🎉 ${event.title}\n📅 ${new Date(event.startAt?.seconds * 1000).toLocaleDateString()}\n📍 ${event.venue || 'Online'}\n\n🎫 Link in bio!\n\n${event.hashtags || '#Events #Community'}`,
    };

    const embedCode = `<iframe src="${eventUrl}" width="100%" height="600" frameborder="0"></iframe>`;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('✅ Copied to clipboard!');
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📣 Promotion Tools</h3>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('social')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'social'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Social Media
                </button>
                <button
                    onClick={() => setActiveTab('qr')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'qr'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    QR Code
                </button>
                <button
                    onClick={() => setActiveTab('embed')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'embed'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Embed Widget
                </button>
            </div>

            {/* Social Media Tab */}
            {activeTab === 'social' && (
                <div className="space-y-4">
                    {Object.entries(socialTemplates).map(([platform, template]) => (
                        <div key={platform} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-900 capitalize">{platform}</h4>
                                <button
                                    onClick={() => copyToClipboard(template)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Copy
                                </button>
                            </div>
                            <textarea
                                value={template}
                                readOnly
                                rows={platform === 'instagram' ? 4 : 6}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm resize-none"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
                <div className="text-center">
                    {qrCode ? (
                        <>
                            <img src={qrCode} alt="Event QR Code" className="mx-auto mb-4 border border-gray-200 rounded-lg p-4" />
                            <p className="text-sm text-gray-600 mb-4">Scan to view event details</p>
                            <div className="flex gap-2 justify-center">
                                <a
                                    href={qrCode}
                                    download={`${event.title}-qr-code.png`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Download QR Code
                                </a>
                                <button
                                    onClick={() => copyToClipboard(eventUrl)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-500">Generating QR code...</div>
                    )}
                </div>
            )}

            {/* Embed Widget Tab */}
            {activeTab === 'embed' && (
                <div>
                    <p className="text-sm text-gray-600 mb-4">
                        Copy this code and paste it into your website to embed the event page:
                    </p>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <code className="text-sm text-gray-800 break-all">{embedCode}</code>
                    </div>
                    <button
                        onClick={() => copyToClipboard(embedCode)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Copy Embed Code
                    </button>
                </div>
            )}
        </div>
    );
};

export default PromotionTools;
