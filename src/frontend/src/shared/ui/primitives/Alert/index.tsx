import type {AlertProps} from "@shared/ui/primitives/Alert/Alert.types.ts";
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Alert(props: AlertProps) {
    const {Alert: Impl} = useDynamicUI();
    return <Impl {...props} />;
}
