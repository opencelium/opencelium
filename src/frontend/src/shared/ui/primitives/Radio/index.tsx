import type {RadioProps} from "@shared/ui/primitives/Radio/Radio.types.ts";
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Radio(props: RadioProps) {
    const {Radio: Impl} = useDynamicUI();
    return <Impl {...props} />;
}
