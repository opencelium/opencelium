import React, {FC, useEffect, useState} from "react";
import {ReferenceInformationProps, Reference} from './interfaces';
import CFieldBinding from "@classes/content/connection/field_binding/CFieldBinding";
import {
    FieldBindingBlockStyled, FieldBindingsBlockStyled,
    ReferenceBlockStyled, ReferenceInformationStyled,
    SourceFieldStyled, SourceMethodNameStyled,
    TargetFieldStyled
} from "@change_component/form_elements/form_connection/form_svg/details/description/technical_process/reference_information/styles";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

const ReferenceInformation: FC<ReferenceInformationProps> =
    ({
        method,
        body,
        connection,
        onReferenceClick,
        isToggledIcon,
        toggleIcon,
    }) => {
    const [fieldBindings, setFieldBindings] = useState<CFieldBinding[]>([]);
    const extractReferences = () => {
        setFieldBindings(connection.getFieldBindingsByMethod(method));
    }
    useEffect(() => {
        extractReferences();
    }, [body, method])
    useEffect(() => {
        if(fieldBindings.length === 0 && isToggledIcon === true){
            toggleIcon(!isToggledIcon);
        }
    }, [fieldBindings])
    const hasFieldBindings = fieldBindings.length > 0;
    return (
        <ReferenceInformationStyled>
            <div>
                <b>{`Reference information`}</b><span>{hasFieldBindings ? '' : ' (is empty now)'}</span>
                {hasFieldBindings &&
                    <TooltipFontIcon
                        tooltipPosition={'right'}
                        style={{verticalAlign: 'middle', cursor: 'pointer'}}
                        onClick={() => toggleIcon(!isToggledIcon)}
                        tooltip={isToggledIcon ? 'Hide' : 'Show'}
                        value={isToggledIcon ? 'expand_less' : 'chevron_right'}
                    />
                }
            </div>
            {isToggledIcon && hasFieldBindings && <FieldBindingsBlockStyled>
                {
                    fieldBindings.map((fieldBinding) => {
                        if(fieldBinding.to.length === 0){
                            return null;
                        }
                        return (
                            <FieldBindingBlockStyled onClick={() => onReferenceClick(fieldBinding.to[0].field)}>
                                <span>
                                    <TargetFieldStyled>{fieldBinding.to[0].field}</TargetFieldStyled>
                                    <span>{` has ${fieldBinding.from.length > 1 ? 'next references: ' : 'one reference: '}`}</span>
                                </span>
                                <div>{
                                    fieldBinding.from.map((item, key) => {
                                        const method = connection.getMethodByColor(item.color);
                                        return (
                                            <ReferenceBlockStyled>
                                                <SourceMethodNameStyled
                                                    style={{background: method.color}}>{method.label || method.name}</SourceMethodNameStyled>
                                                <span>{" bound with "}</span>
                                                <SourceFieldStyled>{item.field}</SourceFieldStyled>
                                                <span>{` field${key !== fieldBinding.from.length - 1 ? ";" : "."}`}</span>
                                            </ReferenceBlockStyled>
                                        );
                                    })
                                }</div>
                            </FieldBindingBlockStyled>
                        )
                    })
                }
            </FieldBindingsBlockStyled>
            }
        </ReferenceInformationStyled>
    );
}

export default ReferenceInformation;
