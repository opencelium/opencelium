import React, {useEffect, useMemo, useRef, useState} from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import {MethodSelectProps} from "@app_component/operator_builder/reference_generator/props";
import {flattenOptions} from "@app_component/operator_builder/utils";
import {ErrorColor} from "@app_component/operator_builder/OperatorBuilder";
import {ErrorMessage} from "@app_component/operator_builder/styles";
import {DefaultInputTextSize} from "@entity/application/utils/constants";

interface OptionType {
    label: string;
    value: string;
    color: string;
}

const MethodSelect: React.FC<MethodSelectProps> = ({onMethodSelect, methodColor, connectionEditor, error}) => {
    const ref = useRef<HTMLDivElement>(null);
    const options = useMemo(() => {
        if (!connectionEditor.connection){
            return [];
        }
        return connectionEditor.connection.getOptionsForMethods(connectionEditor.connector, connectionEditor.item, {isKeyConsidered: false, exceptCurrent: false})
    },[connectionEditor]);
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(methodColor ? options.find((o: any) => o.color === methodColor) : null);
    const hasError = !!error && !methodColor;
    const customStyles: StylesConfig<OptionType, false> = {
        control: (provided, state) => ({
            ...provided,
            color: "black",
            borderColor: hasError ? ErrorColor : state.isFocused ? "#666" : "#ccc",
            boxShadow: state.isFocused ? "0 0 5px rgba(0, 0, 0, 0.2)" : "none",
            "&:hover": {
                borderColor: "#666",
            },
            fontSize: DefaultInputTextSize,
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "black",
            fontSize: DefaultInputTextSize,
        }),
        option: (provided, { data, isFocused, isSelected }) => ({
            ...provided,
            color: "black",
            display: "flex",
            alignItems: "center",
            fontSize: DefaultInputTextSize,
        }),
        noOptionsMessage: (provided: any) => ({
            ...provided,
            fontSize: DefaultInputTextSize,
        }),
        multiValueLabel: (provided: any) => ({
            ...provided,
            fontSize: DefaultInputTextSize,
        }),
        multiValue: (provided: any) => ({
            ...provided,
            fontSize: DefaultInputTextSize,
        }),
        placeholder: (provided: any) => ({
            ...provided,
            fontSize: DefaultInputTextSize,
        }),
        menuPortal: (base) => ({ ...base, zIndex: 10000 }),
    };

    const formatOptionLabel = ({ label, color }: OptionType) => (
        <div style={{ display: "flex", alignItems: "center" }} title={label}>
            <span
              style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: color,
                  marginRight: 10,
              }}
            ></span>
            <span
                style={{
                    textOverflow: 'ellipsis',
                    maxWidth: '99px',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    overflow: 'hidden'
                }}
            >
                {label}
            </span>
        </div>
    );

    const handleChange = (selected: SingleValue<OptionType>) => {
        setSelectedOption(selected);
    };

    useEffect(() => {
        if (selectedOption) {
            if (methodColor !== selectedOption.color) {
                onMethodSelect(selectedOption.color)
            }
        }
    }, [selectedOption])
    useEffect(() => {
        if (methodColor) {
            let flatOptions = flattenOptions(options);
            if (flatOptions.length > 0 && flatOptions[0] === undefined) {
                flatOptions = options;
            }
            setSelectedOption(flatOptions.find((o: OptionType) => o.color === methodColor));
        } else {
            setSelectedOption(null);
        }
    }, [methodColor])
    return (
        <div ref={ref}>
            <Select
                placeholder={'Select Method...'}
                options={options}
                value={selectedOption}
                onChange={handleChange}
                styles={customStyles}
                getOptionLabel={(option) => option.label}
                formatOptionLabel={formatOptionLabel}
                menuPortalTarget={document.body}
                menuPosition="absolute"
            />
            {hasError && <ErrorMessage className={'error-scroll-target'} style={{color: ErrorColor, position: 'absolute', left: ref.current?.offsetLeft, bottom: 3}}>{`${error}`}</ErrorMessage>}
        </div>
    );
};

export default MethodSelect;
