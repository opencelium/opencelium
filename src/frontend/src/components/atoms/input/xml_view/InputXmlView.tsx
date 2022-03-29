import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import Input from "../Input";
import {InputXmlViewProps} from "@atom/input/xml_view/interfaces";
import {getReactXmlStyles} from "@atom/input/xml_view/styles";
import XmlEditor from "@basic_components/xml_editor/XmlEditor";


const InputXmlView: FC<InputXmlViewProps> = ({
        xmlViewProps,
        value,
        placeholder,
        required,
        label,
        icon,
        error,
        isLoading,
        isIconInside,
        readOnly,
        theme,
        ...props
    }) => {
    const hasLabel = label !== '';
    const hasIcon = !!icon;
    const isLoadingWithoutIcon = !hasIcon && isLoading;
    const styleProps = {
        hasIcon,
        isIconInside,
        marginTop: hasLabel ? '25px' : 0,
        marginBottom: '50px',
        paddingLeft: hasIcon && isIconInside ? theme.input.iconInputDistance : '0',
        paddingRight: isLoadingWithoutIcon ? '30px' : 0,
        theme,
    }
    return (
        <Input readOnly={readOnly} value={value} placeholder={placeholder} required={required} label={label} icon={icon} error={error} isLoading={isLoading} isIconInside={isIconInside}>
            <XmlEditor
                style={getReactXmlStyles(styleProps)}
                {...xmlViewProps}
            />
        </Input>
    );
}

InputXmlView.defaultProps = {
    label: '',
    error: '',
    required: false,
    isLoading: false,
}

export default withTheme(InputXmlView);