import {
    Tabs as MuiTabs,
    Tab as MuiTab,
    Box,
} from '@mui/material';
import { useState } from 'react';
import type {TabsComponent} from "@shared/ui/primitives/Tabs/Tabs.types.ts";

export const MaterialTabs: TabsComponent = ({
    items,
    value,
    defaultValue,
    onChange,
}) => {
    const [internalValue, setInternalValue] = useState(
        defaultValue ?? items[0]?.key
    );

    const active = value ?? internalValue;

    const handleChange = (_: any, newValue: string) => {
        if (!value) setInternalValue(newValue);
        onChange?.(newValue);
    };

    return (
        <>
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

            <Box sx={{ padding: '16px' }}>
                {items.find(i => i.key === active)?.content}
            </Box>
        </>
    );
};
