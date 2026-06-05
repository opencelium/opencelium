import React from "react"

interface Props {
    index: number
    isActive: boolean
    isCompleted: boolean
    isSuccess: boolean
}

export function StepCircle({
    index,
    isActive,
    isCompleted,
    isSuccess,
}: Props) {
    const size = 32

    const baseStyle: React.CSSProperties = {
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        transition: "all 0.2s ease",
    }

    if ((isCompleted && !isActive) || isSuccess) {
        return (
            <div
                style={{
                    ...baseStyle,
                    backgroundColor: "var(--color-status-success-fg)",
                    color: "var(--color-text-on-action)",
                    border: `2px solid var(--color-status-success-fg)`,
                }}
            >
                ✓
            </div>
        )
    }

    return (
        <div
            style={{
                ...baseStyle,
                border: `2px solid ${
                    isActive ? "var(--color-action-primary)" : "var(--color-border-default)"
                }`,
                color: isActive ? "var(--color-action-primary)" : "var(--color-text-disabled)",
            }}
        >
            {index + 1}
        </div>
    )
}
