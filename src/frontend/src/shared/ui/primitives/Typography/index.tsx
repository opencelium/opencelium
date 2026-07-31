import type {TypographyProps} from "@shared/ui/primitives/Typography/Typography.types.ts";
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Typography(props: TypographyProps) {
    const { Typography } = useDynamicUI();
    return <Typography {...props} />;
}
