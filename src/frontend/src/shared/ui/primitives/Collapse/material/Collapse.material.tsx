import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import type { CollapseComponent } from '../Collapse.types';

export const MaterialCollapse: CollapseComponent = ({
    items,
    activeKeys,
    defaultActiveKeys,
    accordion = false,
    onChange,
    className,
    style,
}) => {
    const [internalKeys, setInternalKeys] = useState<string[]>(
        defaultActiveKeys ?? []
    );

    const controlled = activeKeys !== undefined;
    const openKeys = controlled ? activeKeys : internalKeys;

    const handleChange = (key: string, expanded: boolean) => {
        let next: string[];
        if (accordion) {
            next = expanded ? [key] : [];
        } else {
            next = expanded
                ? [...openKeys, key]
                : openKeys.filter((k) => k !== key);
        }
        if (!controlled) setInternalKeys(next);
        onChange?.(next);
    };

    return (
        <div className={className} style={style}>
            {items.map((item) => (
                <Accordion
                    key={item.key}
                    expanded={openKeys.includes(item.key)}
                    disabled={item.disabled}
                    onChange={(_, expanded) => handleChange(item.key, expanded)}
                    sx={{
                        border: '1px solid var(--color-border-default)',
                        borderRadius: 'var(--radius-md) !important',
                        marginBottom: '4px',
                        '&:before': { display: 'none' },
                        backgroundColor: 'var(--color-background-surface)',
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{ fontWeight: 500 }}
                    >
                        {item.label}
                    </AccordionSummary>
                    <AccordionDetails>{item.content}</AccordionDetails>
                </Accordion>
            ))}
        </div>
    );
};
