import React, {useEffect, useMemo, useRef, useState} from "react";
import Select from "react-select";
import {OperatorSelectProps} from "@app_component/operator_builder/props";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";
import {
    AllOperatorNames,
    LoopOperatorName,
    OperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";
import OperatorTypeFactory from "@app_component/operator_builder/classes/OperatorTypeFactory";
import {ErrorColor} from "@app_component/operator_builder/OperatorBuilder";
import {ErrorMessage} from "@app_component/operator_builder/styles";
import {DefaultInputTextSize} from "@entity/application/utils/constants";
import HelpIcon from "@app_component/base/tour/HelpIcon";
import LoopOperatorsConfigGenerator
    from "@app_component/operator_builder/classes/loop_operator/LoopOperatorsConfigGenerator";
import IfOperatorsConfigGenerator from "@app_component/operator_builder/classes/if_operator/IfOperatorsConfigGenerator";
import {Step} from "react-joyride";


const OperatorSelect: React.FC<OperatorSelectProps> = ({error, type, operator, updateOperator}) => {
    const ref = useRef<HTMLDivElement>(null);
    const options = useMemo(() => {
        return (new OperatorTypeFactory(type)).getOptions();
    }, [type])
    const tourSteps = useMemo(() => {
        let newTourSteps: Step[] = [];
        if (
            Object.values(LoopOperatorName).includes(operator as LoopOperatorName)
        ) {
            const operatorsConfigGenerator = new LoopOperatorsConfigGenerator();
            newTourSteps = operatorsConfigGenerator.getTourSteps(
                operator as LoopOperatorName
            );
        }
        if (Object.values(AllOperatorNames).includes(operator as OperatorName)) {
            const operatorsConfigGenerator = new IfOperatorsConfigGenerator();
            newTourSteps = operatorsConfigGenerator.getTourSteps(
                operator as OperatorName
            );
        }
        return newTourSteps;
    }, [operator])
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(operator ? options.find(o => o.value === operator) : null);
    const hasError = !!error && !operator;

    useEffect(() => {
        const newOperator = selectedOption?.value as OperatorName || '';
        if (operator !== newOperator){
            if (operator === '' && selectedOption === null) {

            } else {
                updateOperator(newOperator)
            }
        }
    }, [selectedOption]);
    useEffect(() => {
        if (!operator) {
            setSelectedOption(null);
        }
    }, [operator])
    return (
        <div style={{minWidth: '200px', position: 'relative'}} ref={ref}>
            <Select
                placeholder={'Select Operator...'}
                options={options}
                value={selectedOption}
                onChange={setSelectedOption}
                menuPortalTarget={document.body}
                menuPosition="absolute"
                styles={{
                    control: (base, state) => ({
                        ...base,
                        borderColor: !!error && !operator ? ErrorColor : state.isFocused ? "#666" : "#ccc",
                    }),
                    singleValue: (base) => ({
                        ...base,
                        fontSize: DefaultInputTextSize,
                    }),
                    input: (base) => ({
                        ...base,
                        input: {
                            opacity: '1 !important',
                            fontSize: DefaultInputTextSize,
                        },
                    }),
                    noOptionsMessage: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                    }),
                    multiValueLabel: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                    }),
                    multiValue: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                    }),
                    option: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                    }),
                    placeholder: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
                }}
            />
            {tourSteps.length > 0 && <div style={{
                position: 'absolute',
                right: '42px',
                top: 0
            }}>
                <HelpIcon steps={tourSteps} inputRef={ref}/>
            </div>}
            {hasError && <ErrorMessage className={'error-scroll-target'} style={{color: ErrorColor, position: 'absolute', left: ref.current?.offsetLeft, bottom: -15}}>{`${error}`}</ErrorMessage>}
        </div>
    );
};

export default OperatorSelect;
