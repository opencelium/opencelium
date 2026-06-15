import { ErrorColor } from '@app_component/operator_builder/OperatorBuilder';
import { DeepSelectProps } from '@app_component/operator_builder/reference_generator/props';
import { ErrorMessage } from '@app_component/operator_builder/styles';
import React, { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import {DefaultFontFamily, DefaultInputTextSize} from "@entity/application/utils/constants";
import DefaultText from "@app_component/base/text/DefaultText";

type DataStructure = {
	[key: string]: DataStructure | null | DataStructure[] | any;
};

interface OptionType {
	label: string;
	value: string;
}

const DeepSelect: React.FC<DeepSelectProps> = ({
	color,
	onValueSelect,
	field,
	connectionEditor,
	error,
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const [searchValue, setSearchValue] = useState<string>(field);
	const [selectedOption, setSelectedOption] = useState<OptionType | null>(
		null
	);
	const [filteredOptions, setFilteredOptions] = useState<OptionType[]>([]);
	const [allOptions, setAllOptions] = useState<OptionType[]>([]);
	const [iterators, setIterators] = useState<string[]>([]);
	const [menuIsOpen, toggleMenu] = useState<boolean>(false);
	const hasError = !!error && !field && !!color;
	const normalizeCommittedValue = (value: string) => {
		return (value === '$.' ? '$' : value).replace(/\["([^"]*)"\]/g, "['$1']");
	};
	const isSpaceInsertionAllowed = (nextValue: string, prevValue: string) => {
		if (nextValue.length <= prevValue.length) {
			return true;
		}

		let changedIndex = -1;
		const maxLength = Math.max(nextValue.length, prevValue.length);

		for (let i = 0; i < maxLength; i++) {
			if ((nextValue[i] || '') !== (prevValue[i] || '')) {
				changedIndex = i;
				break;
			}
		}

		if (changedIndex === -1 || nextValue[changedIndex] !== ' ') {
			return true;
		}

		const beforeCursor = nextValue.slice(0, changedIndex + 1);
		const hasOpenSingle = /\['[^']*$/.test(beforeCursor);
		const hasOpenDouble = /\["[^"]*$/.test(beforeCursor);

		return hasOpenSingle || hasOpenDouble;
	};
	useEffect(() => {
		setIterators(connectionEditor.connector.getPreviousIterators());
	}, [connectionEditor.connector]);
	useEffect(() => {
		setAllOptions(getNestedOptions(''));
	}, []);

	const getLookupKey = (token: string) => {
		const quotedMatch = token.match(/^\[(["'])(.*)\1\]$/);

		if (quotedMatch) {
			return quotedMatch[2];
		}

		return token;
	};

	const getNestedOptions = (path: string): OptionType[] => {
	const isRoot = path === '$.' || path === '$' || path === '';
	const normalizedPath = isRoot ? '' : path.replace(/^\$(?:\.|(?=\[))/, '');

		const keys =
			normalizedPath.match(/\['[^']+'\]|\["[^"]+"\]|\[\*]|\[\d+]|\[\w+]|\[[^\]]+\]|[^.[\]]+/g) || [];

		let currentData: DataStructure | null = !color
			? {}
			: connectionEditor.connection
				.getMethodByColor(color)
				.response.success.body.fields;

		// IMPORTANT: root starts as '$'
		let lastValidPath = isRoot ? '$' : '';

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (!key) break;

			const isArrayAccess = key.startsWith('[') && key.endsWith(']');
			const lookupKey = getLookupKey(key);
			const isQuotedKey = lookupKey !== key;
			const isIterator =
				isArrayAccess &&
				!isQuotedKey &&
				iterators.includes(key.slice(1, -1));

			if (
				Array.isArray(currentData) &&
				(key === '[*]' || key === '[0]' || isIterator)
			) {
				currentData = currentData[0];
			} else if (
				currentData &&
				typeof currentData === 'object' &&
				lookupKey in currentData
			) {
				currentData = (currentData as DataStructure)[lookupKey] as DataStructure;
			} else {
				break;
			}

			// Build correct JSONPath
			lastValidPath =
				lastValidPath === '$'
					? `$${key.startsWith('[') ? key : `.${key}`}`
					: lastValidPath
						? lastValidPath + (key.startsWith('[') ? key : `.${key}`)
						: key;
		}

		const options: OptionType[] = [];

		// Root option only at top level
		if (normalizedPath === '') {
			options.push({
				label: 'The root object',
				value: '$',
			});
		}

		if (Array.isArray(currentData)) {
			options.push(
				{
					label: 'First element of the array',
					value: lastValidPath === '$' ? `[0]` : `${lastValidPath}[0]`,
				},
				{
					label: 'The whole array',
					value: lastValidPath === '$' ? `[*]` : `${lastValidPath}[*]`,
				},
				...iterators.map((it) => ({
					label: `(${it} loop)`,
					value:
						lastValidPath === '$'
							? `[${it}]`
							: `${lastValidPath}[${it}]`,
				}))
			);

			return options;
		}

		if (currentData && typeof currentData === 'object') {
			options.push(
				...Object.keys(currentData).map((key) => ({
					label: key,
					value:
						lastValidPath === '$'
							? `${key}`
							: lastValidPath
								? `${lastValidPath}.${key}`
								: key,
				}))
			);
		}

		return options;
	};


	const handleInputChange = (input: string, actionMeta: { action: string }) => {
		if (actionMeta.action === 'input-change') {
			if (!isSpaceInsertionAllowed(input, searchValue)) {
				return searchValue;
			}

			setSearchValue(input);

			const newOptions = getNestedOptions(input);
			setFilteredOptions(newOptions);
			if (input === '') {
				setSelectedOption(null);
				return;
			}

			setSelectedOption(null);
			onValueSelect(input, {});
		}
	};

	const handleChange = (selected: OptionType | null) => {
		setSelectedOption(selected);

		if (selected) {
			setSearchValue(selected.value);
			setFilteredOptions(getNestedOptions(selected.value));
			const responseStructure = connectionEditor.connection.getMethodByColor(color)?.response?.success?.body?.fields ?? {};
			// @ts-ignore
			const requestStructure = connectionEditor.connection.getMethodByColor(connectionEditor.item.color)?.request?._body?._fields ?? {};
			const structure = {
				request: requestStructure,
				response: responseStructure,
			};
			onValueSelect(normalizeCommittedValue(selected.value), structure);
		} else {
			if (searchValue) {
				onValueSelect(normalizeCommittedValue(searchValue), {});
			} else {
				setSearchValue('');
				setFilteredOptions(allOptions);
				onValueSelect('', {});
			}
		}
	};
	useEffect(() => {
		if (selectedOption === null && searchValue) {
		} else if (selectedOption) {
			onValueSelect(normalizeCommittedValue(selectedOption.value));
		}
	}, [selectedOption]);
	useEffect(() => {
		// ✅ Root should pass through untouched
		if (field === '') {
			if (searchValue !== '') {
				handleInputChange('', {action: 'input-change'});
				return;
			}
		}

		const normalized = field === '$.' ? '$' : field || '';

		if (normalized !== searchValue) {
			handleInputChange(normalized, { action: 'input-change' });
		}
	}, [field]);

	useEffect(() => {
		if (!field) return;

		const option =
			allOptions.find(o => o.value === field) ||
			filteredOptions.find(o => o.value === field);

		if (option) {
			setSelectedOption(option);
			setSearchValue(option.value);
		}
	}, [field, allOptions]);
	useEffect(() => {
		setFilteredOptions(allOptions);
	}, [allOptions]);

	useEffect(() => {
		if (color && connectionEditor.connection) {
			setAllOptions(getNestedOptions(''));
		}
	}, [color]);
	const getLabelForValue = (value: string) => {
		if (value === '$.') {
			return '$';
		}

		if (value.includes("['") || value.includes('["')) {
			return value;
		}

		if (value.startsWith('$.')) {
			return value.replace(/^\$\./, '');
		}

		const option =
			filteredOptions.find(o => o.value === value) ||
			allOptions.find(o => o.value === value);

		return option?.label || value;
	};
	return (
		<div ref={ref}>
			<Select
				placeholder={'Select Field...'}
				options={filteredOptions}
				inputValue={menuIsOpen
					? searchValue
					: searchValue
						? getLabelForValue(searchValue)
						: searchValue}
				onInputChange={handleInputChange}
				onChange={handleChange}
				value={selectedOption}
				onFocus={() => {
					if (!menuIsOpen) toggleMenu(true);
				}}
				onBlur={() => {
					if (!selectedOption && searchValue) {
						onValueSelect(normalizeCommittedValue(searchValue));
					}
					if (menuIsOpen) toggleMenu(false);
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
				menuPosition='absolute'
			/>
			{hasError && (
				<ErrorMessage
					className={'error-scroll-target'}
					style={{
						color: ErrorColor,
						position: 'absolute',
						left: ref.current?.offsetLeft,
						bottom: 3,
					}}
				><DefaultText value={`${error}`}/></ErrorMessage>
			)}
		</div>
	);
};

export default DeepSelect;
