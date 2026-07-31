import {MaterialFileInput} from "@shared/ui/primitives/FileInput/FileInput.material.tsx";
import {AntFileInput} from "@shared/ui/primitives/FileInput/FileInput.ant.tsx";
import type {FileInputComponent} from "@shared/ui/primitives/FileInput/FileInput.types.ts";
import type {UIFactory} from "@shared/ui/primitives/types.ts";

export const FileInputFactory: UIFactory<FileInputComponent> = {
    default: AntFileInput,
    material: MaterialFileInput,
    ant: AntFileInput,
};
