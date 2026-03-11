import React, {useEffect, useRef, useState} from 'react';
import Select from "react-select";
import {ErrorColor} from "@app_component/operator_builder/OperatorBuilder";
import {DefaultInputTextSize} from "@entity/application/utils/constants";
import {ErrorMessage} from "@app_component/operator_builder/styles";
import {OptionType} from "@app_component/operator_builder/interfaces/IBaseOperator";

type StatusSelectProps = {
    error?: string,
    field: string,
    color: string,
    onValueSelect: (value: string, structure?: any) => void,
}

const StatusSelect = ({error, field, color, onValueSelect}: StatusSelectProps) => {
    const HTTP_STATUS_OPTIONS = [
        {label: "200 OK", value: "200"},
        {label: "201 Created", value: "201"},
        {label: "400 Bad Request", value: "400"},
        {label: "401 Unauthorized", value: "401"},
        {label: "403 Forbidden", value: "403"},
        {label: "404 Not Found", value: "404"},
        {label: "500 Internal Server Error", value: "500"}
    ]

    const [selectedOption, setSelectedOption] = useState<OptionType | null>(
        undefined
    );
    const ref = useRef<HTMLDivElement>(null);
    const hasError = !!error && !field && !!color;
    const selectOption = (selected: OptionType | null) => {
        setSelectedOption(selected);
        onValueSelect(selected.value, {});
    }
    return (
        <div ref={ref}>
            <Select
                placeholder={'Select Operator...'}
                options={HTTP_STATUS_OPTIONS}
                value={selectedOption}
                onChange={selectOption}
                menuPortalTarget={document.body}
                menuPosition="absolute"
                styles={{
                    control: (base, state) => ({
                        ...base,
                        borderColor: hasError
                            ? ErrorColor
                            : state.isFocused
                                ? '#666'
                                : '#ccc',
                        opacity: 1,
                        fontSize: DefaultInputTextSize,
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
            {hasError && (
                <ErrorMessage
                    className={'error-scroll-target'}
                    style={{
                        color: ErrorColor,
                        position: 'absolute',
                        left: ref.current?.offsetLeft,
                        bottom: -15,
                    }}
                >{`${error}`}</ErrorMessage>
            )}
        </div>
    )
}

export default StatusSelect;
