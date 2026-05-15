import React from 'react';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { ThemeName } from '@/shared/theme/types';
import {Switch} from "@shared/ui/primitives/Switch";
import {Button} from "@shared/ui/primitives/Button";

export const ThemeSwitchButton: React.FC = () => {
    const { themeName, toggleTheme } = useTheme();

    return (
        <Switch checked={themeName === ThemeName.Light} label={themeName === ThemeName.Light ? '️☀️ Light mode' : '🌙 Dark mode'} onChange={() => toggleTheme(themeName === ThemeName.Light ? ThemeName.Dark : ThemeName.Light)}/>
    );
};
