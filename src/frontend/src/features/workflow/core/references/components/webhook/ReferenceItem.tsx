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
                    backgroundColor: '#eee',
                    color: "#000",
                    marginLeft: '2px',
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontWeight: 600,
                    cursor: "default",
                    transition: "transform 0.15s ease",
                    transform: isHovered ? "translateY(-2px)" : "none",
                    boxShadow: isHovered ? "0 2px 5px rgba(0,0,0,0.25)" : "none",
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
                            background: "#fff",
                            borderRadius: "50%",
                            border: "none",
                            cursor: "pointer",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                    >
                        <CloseOutlined style={{ color: '#000', fontSize: 12, pointerEvents: "none" }} />
                    </button>
                )}
            </div>
        </div>
    );
};
