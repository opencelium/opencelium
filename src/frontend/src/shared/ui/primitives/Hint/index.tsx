import type {ReactNode} from "react";
import {Alert} from "@shared/ui/primitives/Alert";
import {CommonText} from "@shared/ui/primitives/Text";

type HintProps = {
    children: ReactNode;
    noPrefix?: boolean;
};

export function Hint({children, noPrefix}: HintProps) {
    if (noPrefix) {
        return <Alert type="info" message={children} />;
    }
    return (
        <Alert
            type="info"
            message={<CommonText i18nKey="hintLabel" typoProps={{isBold: true}} />}
            description={children}
        />
    );
}
