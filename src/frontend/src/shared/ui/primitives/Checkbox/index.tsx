import type { CheckboxProps } from './Checkbox.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Checkbox(props: CheckboxProps) {
    const { Checkbox } = useDynamicUI();
    return <Checkbox {...props} />;
}
