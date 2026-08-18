import type {ReactNode} from "react";
import {Alert} from "@shared/ui/primitives/Alert";
import {CommonText} from "@shared/ui/primitives/Text";

type HintProps = {
    children: ReactNode;
    noPrefix?: boolean;
    type?: 'info' | 'success' | 'warning' | 'error';
};

export function Hint({children, noPrefix, type = 'info'}: HintProps) {
    if (noPrefix) {
        return <Alert type={type} message={children} />;
    }
    return (
        <Alert
            type={type}
            message={<CommonText i18nKey="hintLabel" typoProps={{isBold: true}} />}
            description={children}
        />
    );
}
