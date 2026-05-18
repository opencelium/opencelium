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
                    backgroundColor: "#7BC67B",
                    color: "white",
                    border: `2px solid #7BC67B`,
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
                    isActive ? "#6F4FF2" : "#D6D6D6"
                }`,
                color: isActive ? "#6F4FF2" : "#9A9A9A",
            }}
        >
            {index + 1}
        </div>
    )
}
