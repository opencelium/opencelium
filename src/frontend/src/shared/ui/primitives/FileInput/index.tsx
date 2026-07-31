import {useDynamicUI} from "@app/providers/ui/DynamicFacade.tsx";
import type {FileInputProps} from "@shared/ui/primitives/FileInput/FileInput.types.ts";

export function FileInput(props: FileInputProps) {
    const { FileInput } = useDynamicUI();
    return <FileInput {...props} />;
}
