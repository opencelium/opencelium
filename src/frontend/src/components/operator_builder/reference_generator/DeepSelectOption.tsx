import React from 'react';
import {OptionProps} from "react-select";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import UpdateParam from "@app_component/operator_builder/reference_generator/UpdateParamButton";

const DeepSelectOption: React.FC<OptionProps<OptionType>> = (props) => {
    const { data, innerRef, innerProps } = props;

    return (
        <div
            ref={innerRef}
            {...innerProps}
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px",
                cursor: "pointer",
            }}
        >
            <span>{data.label}</span>
            <UpdateParam/>
        </div>
    );
};

export default DeepSelectOption;
