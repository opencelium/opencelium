import React, {useEffect, useMemo, useState} from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import {MethodSelectProps} from "@app_component/operator_builder/reference_generator/props";

interface OptionType {
    label: string;
    value: string;
    color: string;
}

const MethodSelect: React.FC<MethodSelectProps> = ({onMethodSelect, methodColor, builderProps}) => {
    const options = useMemo(() => {
        if (!builderProps.connection){
            return [{label: 'Test', value: 'test', color: '#231'}];
        }
        return builderProps.connection.getOptionsForMethods(builderProps.connector, builderProps.operator, {statement: 'leftStatement', isKeyConsidered: false, exceptCurrent: false})
    },[builderProps]);
    console.log(options);
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(methodColor ? options.find((o: any) => o.color === methodColor) : null);
    const customStyles: StylesConfig<OptionType, false> = {
        control: (provided, state) => ({
            ...provided,
            color: "black",
            borderColor: state.isFocused ? "#666" : "#ccc",
            boxShadow: state.isFocused ? "0 0 5px rgba(0, 0, 0, 0.2)" : "none",
            "&:hover": {
                borderColor: "#666",
            },
        }),
        singleValue: (provided) => ({
            ...provided,
            color: "black",
        }),
        option: (provided, { data, isFocused, isSelected }) => ({
            ...provided,
            color: "black",
            display: "flex",
            alignItems: "center",
        }),
        menuPortal: (base) => ({ ...base, zIndex: 10000 }),
    };

    const formatOptionLabel = ({ label, color }: OptionType) => (
        <div style={{ display: "flex", alignItems: "center" }}>
      <span
          style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: color,
              marginRight: 10,
          }}
      ></span>
            {label}
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
            setSelectedOption(options.find((o: OptionType) => o.color === methodColor));
        }
    }, [methodColor])
    return (
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
    );
};

export default MethodSelect;
