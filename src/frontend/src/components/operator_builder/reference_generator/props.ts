import {ConnectionEditorProps} from "@app_component/operator_builder/props";

export interface ReferenceGeneratorProps {
    setValue: (newValue: string) => void,
    addField?: any,
    reference: string,
    builderProps: ConnectionEditorProps,
    id?: string,
}

export interface MethodSelectProps {
    onMethodSelect: (color: string) => void,
    methodColor: string,
    builderProps: ConnectionEditorProps,
}

export interface DeepSelectProps {
    onValueSelect: (value: string) => void,
    field: string,
    color: string,
    builderProps: ConnectionEditorProps,
}
export type ReferenceType = 'constant' | 'direct' | 'webhook';
export interface ReferenceSwitcherProps {
    referenceType: ReferenceType;
    changeReferenceType: (referenceType: ReferenceType) => void,
}
export interface ReferenceSwitcherStyleProps {
    isHidden?: boolean;
}
export interface ReferenceGeneratorStyleProps {
    referenceType: ReferenceType,
}
