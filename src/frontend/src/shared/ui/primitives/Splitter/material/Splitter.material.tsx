import React, { useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type { SplitterComponent } from '../Splitter.types';

const parseSize = (value: number | string | undefined, totalPx: number): number | null => {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    if (value.trim().endsWith('%')) return (parseFloat(value) / 100) * totalPx;
    return parseFloat(value);
};

export const MaterialSplitter: SplitterComponent = ({
    panels,
    layout = 'horizontal',
    onResizeEnd,
    className,
    style,
}) => {
    const horizontal = layout === 'horizontal';
    const containerRef = useRef<HTMLDivElement>(null);
    const [sizes, setSizes] = useState<number[] | null>(null);
    const drag = useRef<{ index: number; startPos: number; startA: number; startB: number } | null>(null);

    // Seed pixel sizes once the container has measurable extent; panels without a
    // defaultSize share the remaining space equally.
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const totalPx = horizontal ? el.clientWidth : el.clientHeight;
        if (!totalPx) return;
        setSizes((prev) => {
            if (prev && prev.length === panels.length) return prev;
            const explicit = panels.map((p) => parseSize(p.defaultSize, totalPx));
            const used = explicit.reduce<number>((sum, v) => sum + (v ?? 0), 0);
            const autoCount = explicit.filter((v) => v == null).length;
            const each = autoCount ? Math.max(0, totalPx - used) / autoCount : 0;
            return explicit.map((v) => (v == null ? each : v));
        });
    }, [panels, horizontal]);

    const onPointerDown = (index: number) => (event: React.PointerEvent<HTMLDivElement>) => {
        if (!sizes) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
            index,
            startPos: horizontal ? event.clientX : event.clientY,
            startA: sizes[index],
            startB: sizes[index + 1],
        };
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const state = drag.current;
        const el = containerRef.current;
        if (!state || !sizes || !el) return;
        const totalPx = horizontal ? el.clientWidth : el.clientHeight;
        const delta = (horizontal ? event.clientX : event.clientY) - state.startPos;
        const pairTotal = state.startA + state.startB;

        const a = panels[state.index];
        const b = panels[state.index + 1];
        const minA = parseSize(a.min, totalPx) ?? 0;
        const maxA = parseSize(a.max, totalPx) ?? pairTotal;
        const minB = parseSize(b.min, totalPx) ?? 0;
        const maxB = parseSize(b.max, totalPx) ?? pairTotal;

        const lower = Math.max(minA, pairTotal - maxB, 0);
        const upper = Math.min(maxA, pairTotal - minB, pairTotal);
        const nextA = Math.min(Math.max(state.startA + delta, lower), upper);

        setSizes((prev) => {
            if (!prev) return prev;
            const next = [...prev];
            next[state.index] = nextA;
            next[state.index + 1] = pairTotal - nextA;
            return next;
        });
    };

    const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!drag.current) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        drag.current = null;
        if (sizes) onResizeEnd?.(sizes);
    };

    return (
        <Box
            ref={containerRef}
            className={className}
            style={style}
            sx={{
                display: 'flex',
                flexDirection: horizontal ? 'row' : 'column',
                width: '100%',
                height: '100%',
                minWidth: 0,
                minHeight: 0,
            }}
        >
            {panels.map((panel, index) => (
                <React.Fragment key={panel.key}>
                    <Box
                        sx={{
                            flex: sizes ? `0 0 ${sizes[index]}px` : '1 1 0',
                            minWidth: 0,
                            minHeight: 0,
                            overflow: 'auto',
                        }}
                    >
                        {panel.content}
                    </Box>
                    {index < panels.length - 1 && (
                        <Box
                            role="separator"
                            onPointerDown={onPointerDown(index)}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            sx={{
                                flex: '0 0 auto',
                                alignSelf: 'stretch',
                                cursor: horizontal ? 'col-resize' : 'row-resize',
                                width: horizontal ? '8px' : 'auto',
                                height: horizontal ? 'auto' : '8px',
                                background: 'var(--color-border-subtle)',
                                transition: 'background 0.15s',
                                '&:hover': { background: 'var(--color-action-primary)' },
                            }}
                        />
                    )}
                </React.Fragment>
            ))}
        </Box>
    );
};
