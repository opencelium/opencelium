import React, { useState } from "react";
import { ApiOutlined, CloseOutlined } from '@ant-design/icons';
import { Button } from "antd";

interface ReferenceItemProps {
    value: string;
    onDelete?: () => void;
    readOnly?: boolean,
}

export const ReferenceItem: React.FC<ReferenceItemProps> = ({
    value,
    onDelete,
    readOnly,
}) => {
    const [isHovered, setHovered] = useState(false);

    if (!value) return null;
    return (
        <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
        }}>
            <Button disabled type="text" size="small" icon={<ApiOutlined />} style={{marginLeft: 0, marginRight: '-8px'}} />
            <div
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                title={value}
                style={{
                    position: "relative",
                    backgroundColor: 'var(--color-background-hover)',
                    color: "var(--color-text-primary)",
                    marginLeft: '2px',
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "default",
                    transition: "transform 0.15s ease",
                    transform: isHovered ? "translateY(-2px)" : "none",
                    boxShadow: isHovered ? "var(--shadow-md)" : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {value}

                {!readOnly && isHovered && (
                    <button
                        onClick={() => onDelete?.()}
                        style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            background: "var(--color-background-elevated)",
                            borderRadius: "50%",
                            border: "none",
                            cursor: "pointer",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "var(--shadow-sm)",
                        }}
                    >
                        <CloseOutlined style={{ color: 'var(--color-text-primary)', fontSize: 12, pointerEvents: "none" }} />
                    </button>
                )}
            </div>
        </div>
    );
};
