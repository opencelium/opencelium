import type {CSSProperties, ReactNode} from 'react';
import type {PartialStepProps} from "@shared/ui/tour/Tour.tsx";

export interface FormControlProps {
    label?: string;
    labelKey?: string;
    hint?: string;
    error?: ReactNode;
    info?: PartialStepProps,

    name?: string,
    children: ReactNode;
    style?: CSSProperties | undefined;
    autoFocus?: boolean;
    /** Stable selector for e2e tests; the wrapper emits `${testId}-control`. */
    testId?: string;
}

export interface RemoteApiProps {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH'
    /**
     * mapping of all form values
     */
    map: (fieldValue: any, formValues: any) => any
    /**
     * i18n key for the error (if no custom text)
     */
    transKey: string
    query?: boolean
    ignoreError?: boolean
    encodeParams?: boolean
    skipIfUnchanged?: boolean
    shouldSkip?: () => boolean
    /**
     * response handling
     * true → ok
     * string → error
     * false → error with transKey
     */
    handleResponse: (data, error) => boolean | string
}

export interface FormRemoteProps extends RemoteApiProps{
}

export interface StepRemoteProps extends RemoteApiProps{
    onSuccess?: (data: any) => void
}
