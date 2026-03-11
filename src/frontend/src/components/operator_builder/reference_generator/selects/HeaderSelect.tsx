import React, {useEffect, useRef, useState} from 'react'
import Select from 'react-select'
import { DefaultInputTextSize } from "@entity/application/utils/constants"
import { ErrorColor } from "@app_component/operator_builder/OperatorBuilder"
import { ErrorMessage } from "@app_component/operator_builder/styles"
import {DeepSelectProps} from "@app_component/operator_builder/reference_generator/props";


interface OptionType {
    label: string
    value: string
}

const HeaderSelect: React.FC<DeepSelectProps> = ({
    color,
    field,
    error,
    connectionEditor,
    onValueSelect
}) => {

    const ref = useRef<HTMLDivElement>(null);
    const [options, setOptions] = useState<OptionType[]>([])
    const [selectedOption, setSelectedOption] = useState<OptionType | null>(null)

    const hasError = !!error && !field && !!color

    useEffect(() => {
        if (!color) {
            setOptions([])
            return
        }

        const headers =
            connectionEditor.connection
                .getMethodByColor(color)
                ?.response?.success?.header || {}


        const opts: OptionType[] = headers.map((header: any) => ({
            label: `${header.name}`,
            value: header.name
        }))

        setOptions(opts)

    }, [color, connectionEditor.connection])


    useEffect(() => {
        if (!field) {
            setSelectedOption(null)
            return
        }

        const normalizedField = field?.replace(/^\$\./, '')

        const match = options.find(o => o.value === normalizedField)

        if (match) {
            setSelectedOption(match)
        } else {
            setSelectedOption({
                label: normalizedField,
                value: normalizedField
            })
        }

    }, [field, options])


    const handleChange = (selected: OptionType | null) => {
        setSelectedOption(selected)

        if (selected) {
            onValueSelect(selected.value)
        } else {
            onValueSelect('')
        }
    }

    return (
        <div ref={ref}>
            <Select
                placeholder="Select Header..."
                options={options}
                value={selectedOption}
                onChange={handleChange}
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
                    }),
                    singleValue: (base) => ({
                        ...base,
                        opacity: 1,
                        fontSize: DefaultInputTextSize,
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
                menuPortalTarget={document.body}
                menuPosition="absolute"
            />

            {hasError && (
                <ErrorMessage
                    className="error-scroll-target"
                    style={{
                        color: ErrorColor,
                        position: 'absolute',
                        left: ref.current?.offsetLeft,
                        bottom: 3
                    }}
                >
                    {error}
                </ErrorMessage>
            )}
        </div>
    )
}

export default HeaderSelect
