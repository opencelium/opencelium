import type { MultiSelectProps } from './MultiSelect.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function MultiSelect<T>(props: MultiSelectProps<T>) {
    const { MultiSelect } = useDynamicUI();
    return <MultiSelect {...props} />;
}
