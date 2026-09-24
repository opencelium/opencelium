// The header slot this renders into is a fixed 260x120 box (see StepHeader).
// The filename is shown as a caption bar inside the tile (not below it) so the
// tile can use nearly the full 120px height without overflowing that box.
export const wrapperStyle = {
    width: 260,
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
} as const

export const tileStyle = {
    position: 'relative',
    width: 114,
    height: 114,
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
} as const

export const emptyTileStyle = {
    background: 'var(--color-background-surface)',
    border: '1.5px dashed var(--color-border-default)',
    transition: 'border-color 0.15s ease, background 0.15s ease',
} as const

export const filledTileStyle = {
    background: 'var(--color-background-surface)',
} as const

export const imgStyle = {
    width: '94%',
    height: '94%',
    objectFit: 'contain',
    transition: 'opacity 0.15s ease',
} as const

export const overlayStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0,
    transition: 'opacity 0.15s ease',
} as const

export const actionChipStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    padding: 0,
    borderRadius: '50%',
    background: 'rgba(20, 23, 29, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
} as const

export const actionChipDangerStyle = {
    ...actionChipStyle,
    color: '#f0808a',
} as const

export const emptyContentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 8,
} as const

export const emptyLabelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    lineHeight: 1.2,
} as const

export const emptyHintStyle = {
    fontSize: 9,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.2,
} as const

export const hoverCss = `
    .oc-wizard-image-tile--empty:hover,
    .oc-wizard-image-tile--empty:focus-visible {
        border-color: var(--color-action-primary);
        background: var(--color-background-hover);
    }
    .oc-wizard-image-tile:hover .oc-wizard-image-image,
    .oc-wizard-image-tile:focus-within .oc-wizard-image-image {
        opacity: 0.35 !important;
    }
    .oc-wizard-image-tile:hover .oc-wizard-image-overlay,
    .oc-wizard-image-tile:focus-within .oc-wizard-image-overlay {
        opacity: 1 !important;
    }
    .oc-wizard-image-action:hover {
        background: rgba(35, 40, 48, 0.95) !important;
    }
`

export const loadingStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-background-surface)',
    opacity: 0.8,
} as const
