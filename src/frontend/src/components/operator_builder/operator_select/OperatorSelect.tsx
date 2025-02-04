import React, {useEffect, useState} from "react";
import Select from "react-select";
import OperatorsConfigGenerator from "../classes/OperatorsConfigGenerator";
import {OperatorSelectProps} from "@app_component/operator_builder/props";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {OperatorName} from "@app_component/operator_builder/interfaces/OperatorName";

const operatorsGenerator = new OperatorsConfigGenerator();
const options = operatorsGenerator.getAllOptions();
const OperatorSelect: React.FC<OperatorSelectProps> = ({operator, updateOperator}) => {
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(operator ? options.find(o => o.value === operator) : null);
    useEffect(() => {
        const newOperator = selectedOption?.value as OperatorName || '';
        if (operator !== newOperator){
            updateOperator(newOperator)
        }
    }, [selectedOption])
    return (
        <div style={{minWidth: '200px'}}>
            <Select
                placeholder={'Select Operator...'}
                options={options}
                value={selectedOption}
                onChange={setSelectedOption}
                menuPortalTarget={document.body}
                menuPosition="absolute"
                styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
                }}
            />
        </div>
    );
};

export default OperatorSelect;
