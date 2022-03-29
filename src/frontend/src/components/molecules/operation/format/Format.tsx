import React, {FC} from 'react';
import {StatusProps} from "@molecule/operation/interfaces";
import InputRadios from "@atom/input/radio/InputRadios";
import {ResponseFormat, ResponseType} from "@interface/invoker/IBody";

const Format: FC<StatusProps> =
    ({
         value,
         onChange,
         readOnly,
         ...props
    }) => {
        return (
            <InputRadios
                value={value}
                onChange={onChange}
                label={'Format'}
                icon={'text_format'}
                options={[{label: 'Json', value: ResponseFormat.Json, key: ResponseFormat.Json}, {label: 'Xml', value: ResponseFormat.Xml, key: ResponseFormat.Xml}]}
                readOnly={readOnly}
            />

        )
    }

Format.defaultProps = {
}


export {
    Format,
};
