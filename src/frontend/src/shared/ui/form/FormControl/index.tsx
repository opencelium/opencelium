import './FormControl.css';
import type {FormControlProps} from "@shared/ui/form/FormControl/FormControl.type.ts";
import React, {useRef} from "react";
import {useFormConstraints} from "@shared/form/FormConstraintsContext.tsx";
import HelpIcon from "@shared/ui/tour/HelpIcon.tsx";
import {EntityText} from "@shared/ui/primitives/Text";

export const FormControl: React.FC<FormControlProps> = ({
    label,
    labelKey,
    hint,
    error,
    children,
    name,
    info,
    style,
}) => {
    const ref = useRef(null);
    const constraints = useFormConstraints();
    const fieldConstraints = constraints && name ? constraints[name] : undefined;
    const required = fieldConstraints ? fieldConstraints?.required : false;
    return (
        <div className="form-control" style={{position: 'relative', ...style}} ref={ref}>
            {(labelKey || label) && (
                <label className="form-control__label">
                    <span style={{position: 'relative'}}>
                        <EntityText typoProps={{isBold: true}} i18nKey={labelKey || label}/>
                    </span>
                    {required && (
                        <span className="form-control__required">*</span>
                    )}
                </label>
            )}

            {info && <div style={{position: 'absolute', right: -5, top: -4}}>
                <HelpIcon steps={[{
                    ...info,
                    content: <EntityText i18nKey={info.content} />,
                    title: <EntityText i18nKey={labelKey || label}/>,
                    target: '',
                    placement: 'bottom',
                    disableBeacon: true,
                    hideCloseButton: true,
                    hideFooter: true,
                }]} inputRef={ref} />
            </div>}
            <div className="form-control__field">
                {children}
            </div>
            {(!!error || !!hint) ? <div>
                {error ? (
                    <div className="form-control__error">
                        {typeof error === 'string' ?
                        <EntityText i18nKey={error} typoProps={{isDanger: true}}/>
                            : <span>{error}</span>
                        }
                    </div>
                ) : hint ? (
                    <div className="form-control__hint">
                        <EntityText i18nKey={hint}/>
                    </div>
                ) : null}
            </div> : null}
        </div>
    );
};
