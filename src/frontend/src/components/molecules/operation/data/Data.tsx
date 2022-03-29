import React, {FC} from 'react';
import {StatusProps} from "@molecule/operation/interfaces";
import InputRadios from "@atom/input/radio/InputRadios";
import {DataType} from "@interface/invoker/IBody";

const Data: FC<StatusProps> =
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
                label={'Data'}
                icon={'save'}
                options={[{label: 'Raw', value: DataType.Raw, key: DataType.Raw}, {label: 'GraphQL', value: DataType.GraphQL, key: DataType.GraphQL}]}
                readOnly={readOnly}
            />

        )
    }

Data.defaultProps = {
}


export {
    Data,
};
