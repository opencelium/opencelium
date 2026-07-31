import type { InputProps } from './Input.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Input(props: InputProps) {
    const { Input } = useDynamicUI();
    return <Input {...props} />;
}
