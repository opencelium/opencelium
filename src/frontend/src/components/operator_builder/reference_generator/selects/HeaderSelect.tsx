import React, { useEffect, useState } from 'react'
import Select from 'react-select'
import {DefaultFontFamily, DefaultInputTextSize} from "@entity/application/utils/constants"
import { ErrorColor } from "@app_component/operator_builder/OperatorBuilder"
import { ErrorMessage } from "@app_component/operator_builder/styles"

interface HeaderSelectProps {
    color: string
    field: string
    error?: string
    connectionEditor: any
    onValueSelect: (value: string) => void
}

interface OptionType {
    label: string
    value: string
}

const HeaderSelect: React.FC<HeaderSelectProps> = ({
                                                       color,
                                                       field,
                                                       error,
                                                       connectionEditor,
                                                       onValueSelect
                                                   }) => {

    const [searchValue, setSearchValue] = useState<string>(field || '')
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(null)
    const [options, setOptions] = useState<OptionType[]>([])
    const [menuIsOpen, toggleMenu] = useState<boolean>(false)

    const hasError = !!error && !field && !!color
    const normalizeCommittedValue = (value: string) => {
        return value.replace(/\["([^"]*)"\]/g, "['$1']");
    }

    // Load headers
    useEffect(() => {

        if (!color) return

        const headers =
            connectionEditor.connection
                .getMethodByColor(color)
                ?.response?.success?.header || []

        const opts = headers.map((h: any) => ({
            label: h.name,
            value: h.name
        }))

        setOptions(opts)

    }, [color, connectionEditor.connection])



    // Sync with field value
    useEffect(() => {

        if (!field) return

        const normalized = field.replace(/^\$\./, '')

        const option = options.find(o => o.value === normalized)

        setSelectedOption(option || null)
        setSearchValue(normalized)

    }, [field, options])



    const handleInputChange = (input: string, actionMeta: { action: string }) => {

        if (actionMeta.action === 'input-change') {

            setSearchValue(input)

            const exactMatch = options.find(o => o.value === input)

            if (!exactMatch) {
                setSelectedOption(null)
                onValueSelect(input)
            }
        }
    }


    useEffect(() => {
        if (selectedOption === null && searchValue) {
            onValueSelect(normalizeCommittedValue(searchValue));
        } else if (selectedOption) {
            onValueSelect(normalizeCommittedValue(selectedOption.value));
        } else {
            onValueSelect('');
        }
    }, [selectedOption]);

    const handleChange = (selected: OptionType | null) => {
        if (!selected) {
            setSelectedOption(null)
            setSearchValue('')
        } else {
            setSearchValue(selected.value)
            const option = options.find(o => o.value === selected.value)
            setSelectedOption(option || selected)
        }
    }



    const getLabelForValue = (value: string) => {
        const option = options.find(o => o.value === value)
        return option?.label || value
    }



    return (
        <div>

            <Select
                placeholder={'Select Header...'}
                options={options}
                inputValue={
                    menuIsOpen
                        ? searchValue
                        : searchValue
                            ? getLabelForValue(searchValue)
                            : searchValue
                }
                onInputChange={handleInputChange}
                onChange={handleChange}
                value={selectedOption}
                onFocus={() => toggleMenu(true)}
                onBlur={() => {
                    if (!selectedOption && searchValue) {
                        onValueSelect(normalizeCommittedValue(searchValue))
                    }
                    toggleMenu(false)
                }}
                menuIsOpen={menuIsOpen}
                isDisabled={!color}
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
                        fontFamily: DefaultFontFamily,
                    }),
                    singleValue: (base) => ({
                        ...base,
                        opacity: 1,
                        fontSize: DefaultInputTextSize,
                        fontFamily: DefaultFontFamily,
                    }),
                    input: (base) => ({
                        ...base,
                        input: {
                            opacity: '1 !important',
                        },
                    }),
                    noOptionsMessage: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                        fontFamily: DefaultFontFamily,
                    }),
                    multiValueLabel: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                        fontFamily: DefaultFontFamily,
                    }),
                    multiValue: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                        fontFamily: DefaultFontFamily,
                    }),
                    option: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                        fontFamily: DefaultFontFamily,
                    }),
                    placeholder: (provided) => ({
                        ...provided,
                        fontSize: DefaultInputTextSize,
                        fontFamily: DefaultFontFamily,
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 10000 }), 
                }}
                menuPortalTarget={document.body}
                menuPosition="absolute"
            />

            {hasError && (
                <ErrorMessage
                    className="error-scroll-target"
                    style={{
                        color: ErrorColor,
                        position: 'absolute',
                        bottom: -15
                    }}
                >
                    {error}
                </ErrorMessage>
            )}

        </div>
    )
}

export default HeaderSelect
