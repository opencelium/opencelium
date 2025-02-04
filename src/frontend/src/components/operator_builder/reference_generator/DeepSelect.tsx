import React, {useEffect, useState} from "react";
import Select from "react-select";
import {DeepSelectProps} from "@app_component/operator_builder/reference_generator/props";

// Define the structure of nested data
type DataStructure = {
    [key: string]: DataStructure | null | DataStructure[] | any;
};

// Define options type for react-select
interface OptionType {
    label: string;
    value: string;
}

// Nested data structure
const data: DataStructure = {
    car: { wheels: { disk: null, rub: null }, engine: null },
    ship: null,
    persons: [{name: '', age: 0}]
};


const DeepSelect: React.FC<DeepSelectProps> = ({onValueSelect, field, hasColor, options}) => {
    const [searchValue, setSearchValue] = useState<string>(field);
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(null);
    const [filteredOptions, setFilteredOptions] = useState<OptionType[]>(options);

    /**
     * Recursively find sub-options from the nested data based on the given path.
     * @param path The current input value representing a search path.
     * @returns An array of sub-options or an empty array if no further options exist.
     */
    const getNestedOptions = (path: string): OptionType[] => {
        const keys = path.split(".");
        let currentData: DataStructure | null = data;
        let lastValidPath = "";
        let lastKeyPart = "";

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];

            if (key === "") {
                break; // Avoid processing empty keys from accidental trailing dots
            }

            if (i === keys.length - 1) {
                // Store the last part to use for filtering
                lastKeyPart = key;
            }

            if (currentData && typeof currentData === "object" && currentData[key]) {
                currentData = currentData[key];
                lastValidPath += (lastValidPath ? "." : "") + key; // Build the valid path
            } else {
                break;
            }
        }

        if (currentData && typeof currentData === "object") {
            return Object.keys(currentData)
                .filter((key) => key.startsWith(lastKeyPart)) // Partial match filtering
                .map((key) => ({
                    label: key,
                    value: `${lastValidPath}.${key}`,
                }));
        }

        return [];
    };

    /**
     * Handles input changes and updates options accordingly.
     * @param input The search input string.
     * @param actionMeta Metadata about how input was changed.
     */
    const handleInputChange = (input: string, actionMeta: { action: string }) => {
        if (actionMeta.action === "input-change") {
            setSearchValue(input);

            if (input === "") {
                setSelectedOption(null); // Reset selected option when input is cleared
            }
            if (input.includes(".")) {
                // Fetch nested options if input contains a dot
                setFilteredOptions(getNestedOptions(input));
            } else {
                // Filter from top-level options
                setFilteredOptions(
                    options.filter((option: any) =>
                        option.label.toLowerCase().startsWith(input.toLowerCase())
                    )
                );
            }
        }
    };

    /**
     * Handles selection of an option and updates state.
     * @param selectedOption The option selected from the dropdown.
     */
    const handleChange = (selectedOption: OptionType | null) => {
        setSelectedOption(selectedOption);
        if (selectedOption) {
            setSearchValue(selectedOption.value);
            // Determine if further options exist based on selection
            setFilteredOptions(getNestedOptions(selectedOption.value));
        } else {
            setSearchValue('')
        }
    };
    useEffect(() => {
        if (selectedOption){
            onValueSelect(selectedOption.value);
        } else {
            onValueSelect('');
        }
    }, [selectedOption]);
    useEffect(() => {
        if (field !== searchValue) {
            handleInputChange(field, {action: 'input-change'})
        }
    }, [field])
    useEffect(() => {
        setFilteredOptions(options);
    }, [options]);
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
                isDisabled={!hasColor}
                styles={{
                    control: (base) => ({
                        ...base,
                        opacity: 1, // Ensure the input is visible
                    }),
                    singleValue: (base) => ({
                        ...base,
                        opacity: 1, // Prevents the selected value from fading out
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
