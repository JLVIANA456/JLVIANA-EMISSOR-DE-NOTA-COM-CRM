import React, { createContext, useContext, useState, useEffect } from 'react';

interface PersonalizationSettings {
    appName: string;
    logo: string;
    primaryColor: string; // Hex value like "#FF0000"
}

interface PersonalizationContextType {
    settings: PersonalizationSettings;
    updateSettings: (newSettings: Partial<PersonalizationSettings>) => void;
    resetSettings: () => void;
}

const defaultSettings: PersonalizationSettings = {
    appName: 'JLVIANA HUB PRO',
    logo: '/src/assets/logo.png',
    primaryColor: '#e60000', // Red from 0 84% 50%
};

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

// Helper to convert Hex to HSL numbers for CSS variables
function hexToHSL(hex: string): string {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse r, g, b
    let r = parseInt(hex.substring(0, 2), 16) / 255;
    let g = parseInt(hex.substring(2, 4), 16) / 255;
    let b = parseInt(hex.substring(4, 6), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<PersonalizationSettings>(() => {
        const saved = localStorage.getItem('app_personalization_v2'); // New version for hex
        return saved ? JSON.parse(saved) : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('app_personalization_v2', JSON.stringify(settings));
        applySettings(settings);
    }, [settings]);

    const applySettings = (s: PersonalizationSettings) => {
        const root = document.documentElement;
        const hslValue = hexToHSL(s.primaryColor);

        root.style.setProperty('--primary', hslValue);
        root.style.setProperty('--ring', hslValue);
        root.style.setProperty('--sidebar-primary', hslValue);
        root.style.setProperty('--sidebar-accent-foreground', hslValue);
        root.style.setProperty('--accent', hslValue);
        root.style.setProperty('--navy', hslValue);

        document.title = s.appName;
    };

    const updateSettings = (newSettings: Partial<PersonalizationSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    return (
        <PersonalizationContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </PersonalizationContext.Provider>
    );
};

export const usePersonalization = () => {
    const context = useContext(PersonalizationContext);
    if (context === undefined) {
        throw new Error('usePersonalization must be used within a PersonalizationProvider');
    }
    return context;
};
