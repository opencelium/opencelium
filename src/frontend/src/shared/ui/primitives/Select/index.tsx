import type { SelectProps } from './Select.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Select<T>(props: SelectProps<T>) {
    const { Select } = useDynamicUI();
    return <Select {...props} />;
}
