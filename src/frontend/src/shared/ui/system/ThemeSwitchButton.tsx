import React from 'react';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import {Switch} from "@shared/ui/primitives/Switch";

export const ThemeSwitchButton: React.FC = () => {
    const { themeMode, toggleTheme } = useTheme();
    const isLight = themeMode === 'light';

    return (
        <Switch checked={isLight} label={isLight ? '️☀️ Light mode' : '🌙 Dark mode'} onChange={() => toggleTheme()} testId="theme-switch"/>
    );
};
