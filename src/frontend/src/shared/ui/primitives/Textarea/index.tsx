import type { TextareaProps } from './Textarea.types';
import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";

export function Textarea(props: TextareaProps) {
    const { Textarea } = useDynamicUI();
    return <Textarea {...props} />;
}
