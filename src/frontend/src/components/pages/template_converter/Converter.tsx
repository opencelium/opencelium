import React, {FC} from 'react';
import { ConverterStyled } from './styles';
import {TemplateConverter} from "@oc_modules/template_converter";

const Converter: FC =
    ({

    }) => {
    return (
        <ConverterStyled >
            <TemplateConverter/>
        </ConverterStyled>
    )
}

Converter.defaultProps = {
}


export {
    Converter,
};