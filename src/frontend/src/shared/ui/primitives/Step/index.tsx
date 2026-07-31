import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";
import type {DividerProps} from "@shared/ui/primitives/Divider/Divider.types.tsx";

export function Divider (props: DividerProps) {
    const { Divider } = useDynamicUI();
    return <Divider {...props} />;
}
