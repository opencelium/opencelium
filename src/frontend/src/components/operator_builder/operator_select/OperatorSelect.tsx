import React, {useEffect, useMemo, useState} from "react";
import Select from "react-select";
import {OperatorSelectProps} from "@app_component/operator_builder/props";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {OperatorName} from "@app_component/operator_builder/interfaces/OperatorName";
import OperatorTypeFactory from "@app_component/operator_builder/classes/OperatorTypeFactory";


const OperatorSelect: React.FC<OperatorSelectProps> = ({type, operator, updateOperator}) => {
    const options = useMemo(() => {
        return (new OperatorTypeFactory(type)).getOptions();
    }, [type])
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
