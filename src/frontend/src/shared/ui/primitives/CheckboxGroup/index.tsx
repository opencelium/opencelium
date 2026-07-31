import type { CheckboxGroupProps } from './CheckboxGroup.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function CheckboxGroup(props: CheckboxGroupProps) {
    const { CheckboxGroup } = useDynamicUI();
    return <CheckboxGroup {...props} />;
}
