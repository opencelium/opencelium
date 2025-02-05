import {OperatorBuilderProps} from "@app_component/operator_builder/props";

export interface ReferenceGeneratorProps {
    setValue: (newValue: string) => void,
    addField?: any,
    reference: string,
    builderProps: OperatorBuilderProps,
    id?: string,
}

export interface MethodSelectProps {
    onMethodSelect: (color: string) => void,
    methodColor: string,
    builderProps: OperatorBuilderProps,
}

export interface DeepSelectProps {
    onValueSelect: (value: string) => void,
    field: string,
    color: string,
    builderProps: OperatorBuilderProps,
}
export type ReferenceType = 'direct' | 'webhook';
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
