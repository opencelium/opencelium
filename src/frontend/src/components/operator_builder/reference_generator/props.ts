import { ConnectionEditorProps } from "@app_component/operator_builder/props";

export interface ReferenceGeneratorProps {
    setReference: (reference: string) => void,
    addField?: any,
    reference?: string,
    connectionEditor: ConnectionEditorProps,
    id?: string,
    parent?: any;
    isAbsolute?: boolean;
    manualAdd?: boolean;
    actionButtonTooltip?: string;
    actionButtonValue?: string;
    submitEdit?: any;
    ref?: any,
}

export interface MethodSelectProps {
    onMethodSelect: (color: string) => void,
    methodColor: string,
    connectionEditor: ConnectionEditorProps,
}

export interface DeepSelectProps {
    onValueSelect: (value: string) => void,
    field: string,
    color: string,
    connectionEditor: ConnectionEditorProps,
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
    isAbsolute?: boolean;
    parent?: boolean;
}
