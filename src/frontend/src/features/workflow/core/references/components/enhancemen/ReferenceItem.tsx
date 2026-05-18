import React, { useState } from "react";
import { CloseOutlined } from "@ant-design/icons";
import { parseEnhancementArg } from '../../../../components/request-editor/utils/parseEnhancementArg';
import {
    getReferenceDisplayLabel,
    getReferenceDisplayTitle,
} from '../../../../components/request-editor/shared/referenceDisplay';

interface ReferenceItemProps {
    argKey?: string;
    value: string;
    onDelete?: (argKey: string) => void;
    readOnly?: boolean,
}

export const ReferenceItem: React.FC<ReferenceItemProps> = ({
    argKey,
    value,
    onDelete,
    readOnly,
}) => {
    const parsed = parseEnhancementArg(value);
    const [isHovered, setHovered] = useState(false);

    if (!parsed) return null;

    const readableTitle = getReferenceDisplayTitle(value);
    const readableLabel = getReferenceDisplayLabel(value);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={readableTitle}
            style={{
                position: "relative",
                backgroundColor: parsed.color,
                color: "#fff",
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
            {readableLabel}

            {!readOnly && isHovered && argKey && (
                <button
                    onClick={() => onDelete?.(argKey)}
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
                    <CloseOutlined style={{ color: parsed.color, fontSize: 12, pointerEvents: "none" }} />
                </button>
            )}
        </div>
    );
};
