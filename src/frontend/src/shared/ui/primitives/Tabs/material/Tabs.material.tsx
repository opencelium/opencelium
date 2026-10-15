import {
    Tabs as MuiTabs,
    Tab as MuiTab,
    Box,
} from '@mui/material';
import { useState, type SyntheticEvent } from 'react';
import type {TabsComponent} from "@shared/ui/primitives/Tabs/Tabs.types.ts";

export const MaterialTabs: TabsComponent = ({
    items,
    value,
    defaultValue,
    onChange,
    isFullHeight,
}) => {
    const [internalValue, setInternalValue] = useState(
        defaultValue ?? items[0]?.key
    );

    const active = value ?? internalValue;

    const handleChange = (_: SyntheticEvent, newValue: string) => {
        if (!value) setInternalValue(newValue);
        onChange?.(newValue);
    };

    return (
        <Box sx={isFullHeight ? { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } : undefined}>
            <MuiTabs
                value={active}
                onChange={handleChange}
                sx={{
                    borderBottom: '1px solid var(--color-border-default)',
                }}
            >
                {items.map((item) => (
                    <MuiTab
                        key={item.key}
                        label={item.label}
                        value={item.key}
                        disabled={item.disabled}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    />
                ))}
            </MuiTabs>

            <Box sx={isFullHeight ? { padding: '16px', flex: 1, minHeight: 0 } : { padding: '16px' }}>
                {items.find(i => i.key === active)?.content}
            </Box>
        </Box>
    );
};
