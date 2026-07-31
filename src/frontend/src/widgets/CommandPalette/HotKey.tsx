import React from 'react';
import {Typography} from "@shared/ui/primitives/Typography";
import {useTheme} from "@shared/theme/hooks/useTheme.tsx";

const HotKey = (props) => {
    const {theme} = useTheme();
    const kbdStyle: React.CSSProperties = {
        padding: '2px 6px',
        borderRadius: 6,
        border: `1px solid ${theme.color.border.subtle}`,
        background: theme.color.background.elevated,
        color: theme.color.text.secondary,
        fontSize: 11,
        fontFamily: 'monospace',
    };
    return (
        <span
            style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
            }}>
            <Typography isSubtle>
                <kbd style={kbdStyle}>Ctrl</kbd>
                +
                <kbd style={kbdStyle}>K</kbd>
            </Typography>
        </span>
    );
};

export default HotKey;
