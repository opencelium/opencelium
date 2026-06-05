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
                color: "var(--color-text-on-action)",
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
            {readableLabel}

            {!readOnly && isHovered && argKey && (
                <button
                    onClick={() => onDelete?.(argKey)}
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
                    <CloseOutlined style={{ color: parsed.color, fontSize: 12, pointerEvents: "none" }} />
                </button>
            )}
        </div>
    );
};
