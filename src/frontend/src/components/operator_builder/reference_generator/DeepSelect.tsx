import React, {useEffect, useState} from "react";
import Select from "react-select";
import {DeepSelectProps} from "@app_component/operator_builder/reference_generator/props";
import DeepSelectOption from "@app_component/operator_builder/reference_generator/DeepSelectOption";

// Define the structure of nested data
type DataStructure = {
    [key: string]: DataStructure | null | DataStructure[] | any;
};

// Define options type for react-select
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
    useEffect(() => {
        setIterators(builderProps.connector.getPreviousIterators());
    }, [builderProps.connector]);
    useEffect(() => {
        setAllOptions(getNestedOptions(''));
    }, []);
    /**
     * Recursively find sub-options from the nested data based on the given path.
     * @param path The current input value representing a search path.
     * @returns An array of sub-options or an empty array if no further options exist.
     */
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
                break; // Avoid processing empty keys from accidental trailing dots
            }

            if (i === keys.length - 1) {
                // Store the last part to use for filtering
                lastKeyPart = key;
            }

            if (currentData && typeof currentData === "object" && key in currentData) {
                currentData = currentData[key];
                lastValidPath += (lastValidPath ? "." : "") + key;
            } else if (Array.isArray(currentData) && (key === "[0]" || key === "[*]" || iterators.includes(key.slice(1, -1)))) {
                // Navigate into the first element if `[0]` is selected
                currentData = key === "[*]" ? currentData : currentData[0];
                lastValidPath += (lastValidPath ? "." : "") + key;
            } else {
                break;
            }
        }

        if (Array.isArray(currentData)) {
            // If the current data is an array, show special options
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
                .filter((key) => key.startsWith(lastKeyPart)) // Partial match filtering
                .map((key) => ({
                    label: key,
                    value: lastValidPath === '' ? key : `${lastValidPath}.${key}`,
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
                    allOptions.filter((option: any) =>
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
            const newOptions = builderProps
                .connection
                .getMethodByColor(color)
                .response
                .success
                .getFields(searchValue, builderProps.connector)
            setAllOptions(getNestedOptions(''));
        }
    }, [color/*, searchValue*/]);
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
                isDisabled={!color}
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
                //components={{ Option: DeepSelectOption }}
            />
        </div>
    );
};

export default DeepSelect;
