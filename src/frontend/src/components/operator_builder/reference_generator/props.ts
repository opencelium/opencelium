import { ConnectionEditorProps } from "@app_component/operator_builder/props";
import {LoopOperatorName, OperatorName} from "@app_component/operator_builder/interfaces/OperatorName";

export interface ReferenceGeneratorProps {
    setReference: (reference: string) => void,
    addField?: any,
    reference?: string,
    isBuilder: boolean,
    error?: string,
    operator?: OperatorName | LoopOperatorName | '',
    connectionEditor: ConnectionEditorProps,
    id?: string,
    parent?: any;
    isAbsolute?: boolean;
    manualAdd?: boolean;
    actionButtonTooltip?: string;
    actionButtonValue?: string;
    submitEdit?: any;
    editCancel?: any;
    endpointReference?: boolean;
    bodyReference?: boolean;
    headerReference?: boolean;
    style?: any,
}

export interface MethodSelectProps {
    onMethodSelect: (color: string) => void,
    methodColor: string,
    connectionEditor: ConnectionEditorProps,
    error?: string,
}

export interface DeepSelectProps {
    onValueSelect: (value: string) => void,
    field: string,
    color: string,
    connectionEditor: ConnectionEditorProps,
    error?: string,
}
export type ReferenceType = 'constant' | 'direct' | 'webhook';
export interface ReferenceSwitcherProps {
    referenceType: ReferenceType;
    changeReferenceType: (referenceType: ReferenceType) => void,
    hasNotConstant: boolean,
}
export interface ReferenceSwitcherStyleProps {
    isHidden?: boolean;
    hasNotConstant: boolean;
}
export interface ReferenceGeneratorStyleProps {
    referenceType: ReferenceType,
    isAbsolute?: boolean;
    parent?: boolean;
    endpointReference?: boolean;
    manualAdd?: boolean;
    isLikeOperator?: boolean;
}

export enum ConstantComponentType {
    Text= 'text',
    Textarea= 'textarea',
    Select= 'select' ,
}

export interface ConstantSelectOptions {
    label: string,
    value: string,
}
