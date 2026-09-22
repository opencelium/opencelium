import type {ReactNode} from "react";
import {Alert} from "@shared/ui/primitives/Alert";
import {CommonText} from "@shared/ui/primitives/Text";

type HintProps = {
    children: ReactNode;
    noPrefix?: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
    closable?: boolean;
    onClose?: () => void;
};

export function Hint({children, noPrefix, type = 'info', closable, onClose}: HintProps) {
    if (noPrefix) {
        return <Alert type={type} message={children} closable={closable} onClose={onClose} />;
    }
    return (
        <Alert
            type={type}
            message={<CommonText i18nKey="hintLabel" typoProps={{isBold: true}} />}
            description={children}
            closable={closable}
            onClose={onClose}
        />
    );
}
