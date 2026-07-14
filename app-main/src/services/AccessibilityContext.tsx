/**
 * AccessibilityContext
 * Manages app-wide accessibility settings
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo, useColorScheme } from 'react-native';

export interface AccessibilitySettings {
    screenReaderEnabled: boolean;
    highContrastMode: boolean;
    fontSize: number; // Multiplier: 0.8 - 2.0
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
    reduceMotion: boolean;
}

interface AccessibilityContextType {
    settings: AccessibilitySettings;
    updateSettings: (settings: Partial<AccessibilitySettings>) => Promise<void>;
    getAdjustedColor: (color: string) => string;
    getAdjustedFontSize: (baseSize: number) => number;
}

const defaultSettings: AccessibilitySettings = {
    screenReaderEnabled: false,
    highContrastMode: false,
    fontSize: 1.0,
    colorBlindMode: 'none',
    reduceMotion: false,
};

const AccessibilityContext = createContext<AccessibilityContextType>({
    settings: defaultSettings,
    updateSettings: async () => { },
    getAdjustedColor: (color) => color,
    getAdjustedFontSize: (size) => size,
});

export const useAccessibility = () => useContext(AccessibilityContext);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
    const colorScheme = useColorScheme();

    useEffect(() => {
        loadSettings();
        checkScreenReader();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem('accessibility_settings');
            if (stored) {
                setSettings(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading accessibility settings:', error);
        }
    };

    const checkScreenReader = () => {
        AccessibilityInfo.isScreenReaderEnabled().then(screenReaderEnabled => {
            setSettings(prev => ({ ...prev, screenReaderEnabled }));
        });

        const subscription = AccessibilityInfo.addEventListener(
            'screenReaderChanged',
            screenReaderEnabled => {
                setSettings(prev => ({ ...prev, screenReaderEnabled }));
            }
        );

        return () => subscription.remove();
    };

    const updateSettings = async (newSettings: Partial<AccessibilitySettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        try {
            await AsyncStorage.setItem('accessibility_settings', JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving accessibility settings:', error);
        }
    };

    const getAdjustedColor = (color: string): string => {
        if (settings.highContrastMode) {
            // Convert to high contrast
            return color === '#FFFFFF' || color === '#FFF' ? '#000000' : '#FFFFFF';
        }

        if (settings.colorBlindMode !== 'none') {
            // Apply color blind filter
            return applyColorBlindFilter(color, settings.colorBlindMode);
        }

        return color;
    };

    const getAdjustedFontSize = (baseSize: number): number => {
        return baseSize * settings.fontSize;
    };

    const applyColorBlindFilter = (
        color: string,
        mode: 'protanopia' | 'deuteranopia' | 'tritanopia'
    ): string => {
        // Simplified color blind simulation
        // In production, use proper color transformation matrices

        if (mode === 'protanopia') {
            // Red-blind: reduce red channel
            return color.replace(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i, (match, r, g, b) => {
                const newR = Math.floor(parseInt(r, 16) * 0.5);
                return `#${newR.toString(16).padStart(2, '0')}${g}${b}`;
            });
        }

        if (mode === 'deuteranopia') {
            // Green-blind: reduce green channel
            return color.replace(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i, (match, r, g, b) => {
                const newG = Math.floor(parseInt(g, 16) * 0.5);
                return `#${r}${newG.toString(16).padStart(2, '0')}${b}`;
            });
        }

        if (mode === 'tritanopia') {
            // Blue-blind: reduce blue channel
            return color.replace(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i, (match, r, g, b) => {
                const newB = Math.floor(parseInt(b, 16) * 0.5);
                return `#${r}${g}${newB.toString(16).padStart(2, '0')}`;
            });
        }

        return color;
    };

    return (
        <AccessibilityContext.Provider
            value={{
                settings,
                updateSettings,
                getAdjustedColor,
                getAdjustedFontSize,
            }}
        >
            {children}
        </AccessibilityContext.Provider>
    );
};

export default AccessibilityContext;
