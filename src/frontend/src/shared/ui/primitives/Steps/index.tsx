import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";
import type {StepsProps} from "@shared/ui/primitives/Steps/Divider.types.tsx";

export function Steps (props: StepsProps) {
    const { Steps } = useDynamicUI();
    return <Steps {...props} />;
}
