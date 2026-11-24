import React from 'react'
import { Typography } from '@shared/ui/primitives/Typography'

// Same label/value layout as the subscription page's license information.
export const OverviewRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <>
        <Typography isBold>{label}:</Typography>
        <div style={{ minWidth: 0, textAlign: 'right' }}><Typography as="div">{children}</Typography></div>
    </>
)
