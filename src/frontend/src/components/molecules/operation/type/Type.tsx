import React, {FC} from 'react';
import {StatusProps} from "@molecule/operation/interfaces";
import InputRadios from "@atom/input/radio/InputRadios";
import {ResponseType} from "@interface/invoker/IBody";

const Type: FC<StatusProps> =
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
                label={'Type'}
                icon={'title'}
                options={[{label: 'Object', value: ResponseType.Object, key: ResponseType.Object}, {label: 'Array', value: ResponseType.Array, key: ResponseType.Array}]}
                readOnly={readOnly}
            />

        )
    }

Type.defaultProps = {
}


export {
    Type,
};
