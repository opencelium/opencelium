import React from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n.ts';
import { useTheme } from '@shared/theme/hooks/useTheme.tsx';

type HintProps = {
    keys: string[];
    label: string;
};

export const PaletteFooter: React.FC = () => {
    const { t } = useI18n('common');
    const { theme } = useTheme();

    const kbdStyle: React.CSSProperties = {
        padding: '2px 6px',
        borderRadius: 6,
        border: `1px solid ${theme.color.border.strong}`,
        background: theme.color.background.elevated,
        color: theme.color.text.secondary,
        fontSize: 11,
        fontFamily: 'monospace',
    };

    const labelStyle: React.CSSProperties = {
        color: theme.color.text.secondary,
        fontSize: 11,
    };

    const Hint: React.FC<HintProps> = ({ keys, label }) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            {keys.map((k, i) => (
                <kbd key={i} style={kbdStyle}>{k}</kbd>
            ))}
            <span style={labelStyle}>{label}</span>
        </span>
    );

    return (
        <div className="cmdk-footer">
            <Hint keys={['↵']} label={t('commandPalette.footer.select')} />
            <Hint keys={['Tab']} label={t('commandPalette.footer.autocomplete')} />
            <Hint keys={['↑', '↓']} label={t('commandPalette.footer.navigate')} />
            <Hint keys={['Esc']} label={t('commandPalette.footer.close')} />
        </div>
    );
};
