import React, {useEffect, useState} from "react";
import Select from "react-select";
import {DeepSelectProps} from "@app_component/operator_builder/reference_generator/props";

type DataStructure = {
    [key: string]: DataStructure | null | DataStructure[] | any;
};

interface OptionType {
    label: string;
    value: string;
}

const DeepSelect: React.FC<DeepSelectProps> = ({color, onValueSelect, field, builderProps}) => {
    const [searchValue, setSearchValue] = useState<string>(field);
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(undefined);
    const [filteredOptions, setFilteredOptions] = useState<OptionType[]>([]);
    const [allOptions, setAllOptions] = useState<OptionType[]>([]);
    const [iterators, setIterators] = useState<string[]>([]);
    const [menuIsOpen, toggleMenu] = useState<boolean>(false);
    useEffect(() => {
        setIterators(builderProps.connector.getPreviousIterators());
    }, [builderProps.connector]);
    useEffect(() => {
        setAllOptions(getNestedOptions(''));
    }, []);
    const getNestedOptions = (path: string): OptionType[] => {
        const keys = path.split(".");
        let currentData: DataStructure | null = !color ? {} : builderProps
            .connection
            .getMethodByColor(color)
            .response
            .success.body.fields;
        let lastValidPath = "";
        let lastKeyPart = "";

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (key === "") {
                break;
            }
            if (i === keys.length - 1) {
                lastKeyPart = key;
            }
            if (currentData && typeof currentData === "object" && key in currentData) {
                currentData = currentData[key];
                lastValidPath += (lastValidPath ? "." : "") + key;
            } else if (Array.isArray(currentData) && (key === "[0]" || key === "[*]" || iterators.includes(key.slice(1, -1)))) {
                currentData = currentData[0];
                lastValidPath += (lastValidPath ? "." : "") + key;
            } else {
                break;
            }
        }
        if (Array.isArray(currentData)) {
            return [
                { label: "First element of the array", value: `${lastValidPath ? `${lastValidPath}.` : ''}[0]` },
                { label: "The whole array", value: `${lastValidPath ? `${lastValidPath}.` : ''}[*]` },
                ...iterators.map((it) => ({
                    label: `(${it} loop)`,
                    value: `${lastValidPath ? `${lastValidPath}.` : ''}[${it}]`,
                })),
            ];
        }
        if (currentData && typeof currentData === "object") {
            return Object.keys(currentData)
                .filter((key) => key.startsWith(lastKeyPart))
                .map((key) => ({
                    label: key,
                    value: lastValidPath === '' ? key : `${lastValidPath}.${key}`,
                }));
        }

        return [];
    };

    const handleInputChange = (input: string, actionMeta: { action: string }) => {
        if (actionMeta.action === "input-change") {
            setSearchValue(input);

            if (input === "") {
                setSelectedOption(null);
            }
            if (input.includes(".")) {
                if (input.endsWith(".[0]") || input.endsWith(".[*]") || iterators.some(it => input.endsWith(`.[${it}]`))) {
                    setFilteredOptions(getNestedOptions(`${input}.`));
                } else {
                    setFilteredOptions(getNestedOptions(input));
                }
            } else {
                setFilteredOptions(
                    allOptions.filter((option: any) =>
                        option.label.toLowerCase().startsWith(input.toLowerCase())
                    )
                );
            }
        }
    };

    const handleChange = (selectedOption: OptionType | null) => {
        setSelectedOption(selectedOption);
        if (selectedOption) {
            setSearchValue(selectedOption.value);
            if (selectedOption && (selectedOption.value.endsWith(".[0]") || selectedOption.value.endsWith(".[*]") || iterators.some(it => selectedOption.value.endsWith(`.[${it}]`)))) {
                setFilteredOptions(getNestedOptions(`${selectedOption.value}.`));
            } else {
                setFilteredOptions(getNestedOptions(selectedOption?.value || ""));
            }
        } else {
            setSearchValue('')
            setFilteredOptions(allOptions);
        }
    };
    useEffect(() => {
        if (selectedOption !== undefined) {
            if (selectedOption){
                onValueSelect(selectedOption.value);
            } else {
                onValueSelect('');
            }
        }
    }, [selectedOption]);
    useEffect(() => {
        if (field !== searchValue) {
            handleInputChange(field, {action: 'input-change'})
        }
    }, [field])
    useEffect(() => {
        setFilteredOptions(allOptions);
    }, [allOptions]);

    useEffect(() => {
        if (color && builderProps.connection) {
            setAllOptions(getNestedOptions(''));
        }
    }, [color]);
    return (
        <div>
            <Select
                placeholder={'Select Field...'}
                options={filteredOptions}
                inputValue={searchValue}
                onInputChange={handleInputChange}
                onChange={handleChange}
                value={selectedOption}
                isClearable
                onFocus={() => {if (!menuIsOpen) toggleMenu(true)}}
                onBlur={() => {if (menuIsOpen) toggleMenu(false)}}
                menuIsOpen={menuIsOpen}
                isDisabled={!color}
                styles={{
                    control: (base) => ({
                        ...base,
                        opacity: 1,
                    }),
                    singleValue: (base) => ({
                        ...base,
                        opacity: 1,
                    }),
                    input: (base) => ({
                        ...base,
                        input: {
                            opacity: "1 !important",
                        },
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 10000 }),
                }}
                menuPortalTarget={document.body}
                menuPosition="absolute"
            />
        </div>
    );
};

export default DeepSelect;
