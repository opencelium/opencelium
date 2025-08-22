import { ErrorColor } from '@app_component/operator_builder/OperatorBuilder';
import { DeepSelectProps } from '@app_component/operator_builder/reference_generator/props';
import { ErrorMessage } from '@app_component/operator_builder/styles';
import React, { useEffect, useRef, useState } from 'react';
import Select from 'react-select';

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
		undefined
	);
	const [filteredOptions, setFilteredOptions] = useState<OptionType[]>([]);
	const [allOptions, setAllOptions] = useState<OptionType[]>([]);
	const [iterators, setIterators] = useState<string[]>([]);
	const [menuIsOpen, toggleMenu] = useState<boolean>(false);
	const hasError = !!error && !field && !!color;
	useEffect(() => {
		setIterators(connectionEditor.connector.getPreviousIterators());
	}, [connectionEditor.connector]);
	useEffect(() => {
		setAllOptions(getNestedOptions(''));
	}, []);
	const getNestedOptions = (path: string): OptionType[] => {
		const keys = path.match(/[^.[\]]+|\[\*]|\[\d+]|\[\w+]/g) || [];

		let currentData: DataStructure | null = !color
			? {}
			: connectionEditor.connection.getMethodByColor(color).response.success
					.body.fields;

		let lastValidPath = '';

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (key === '') break;

			const isArrayAccess = key.startsWith('[') && key.endsWith(']');
			const isIterator = isArrayAccess && iterators.includes(key.slice(1, -1));

			if (
				Array.isArray(currentData) &&
				(key === '[*]' || key === '[0]' || isIterator)
			) {
				currentData = currentData[0];
			} else if (
				currentData &&
				typeof currentData === 'object' &&
				key in currentData
			) {
				currentData = (currentData as DataStructure)[key] as DataStructure;
			} else {
				break;
			}

			lastValidPath = lastValidPath
				? lastValidPath + (key.startsWith('[') ? key : `.${key}`)
				: key;
		}

		if (Array.isArray(currentData)) {
			return [
				{ label: 'First element of the array', value: `${lastValidPath}[0]` },
				{ label: 'The whole array', value: `${lastValidPath}[*]` },
				...iterators.map((it) => ({
					label: `(${it} loop)`,
					value: `${lastValidPath}[${it}]`,
				})),
			];
		}

		if (currentData && typeof currentData === 'object') {
			return Object.keys(currentData).map((key) => ({
				label: key,
				value: lastValidPath === '' ? key : `${lastValidPath}.${key}`,
			}));
		}

		return [];
	};

	const handleInputChange = (input: string, actionMeta: { action: string }) => {
		if (actionMeta.action === 'input-change') {
			setSearchValue(input);

			if (input === '') {
				setSelectedOption(null);
				return;
			}

			setFilteredOptions(getNestedOptions(input));
		}
	};

	const handleChange = (selected: OptionType | null) => {
		setSelectedOption(selected);

		if (selected) {
			setSearchValue(selected.value);
			setFilteredOptions(getNestedOptions(selected.value));
			const responseStructure = connectionEditor.connection.getMethodByColor(color)
				?.response?.success?.body?.fields ?? {};
				// @ts-ignore
			const requestStructure = connectionEditor.connection.getMethodByColor(connectionEditor.item.color)
				?.request?._body?._fields ?? {};
			const structure = {
				request: requestStructure,
				response: responseStructure
			}
			onValueSelect(selected.value, structure);
		} else {
			setSearchValue('');
			setFilteredOptions(allOptions);
			onValueSelect('', {});
		}
	};
	useEffect(() => {
		if (selectedOption === null && searchValue) {
			onValueSelect(searchValue);
		} else if (selectedOption) {
			onValueSelect(selectedOption.value);
		}
	}, [selectedOption]);
	useEffect(() => {
		const unwrapped =
			field
				?.replace(/\['(.*?)'\]/g, (match, val, offset, str) => {
					const prevChar = str[offset - 1];

					if (prevChar === '.') {
						return val;
					}

					if (offset === 0) {
						return val;
					}

					return `.${val}`;
				})
				.replace(/\.\./g, '.') || '';

		if (unwrapped !== searchValue) {
			handleInputChange(unwrapped, { action: 'input-change' });
		}
	}, [field]);

	useEffect(() => {
		setFilteredOptions(allOptions);
	}, [allOptions]);

	useEffect(() => {
		if (color && connectionEditor.connection) {
			setAllOptions(getNestedOptions(''));
		}
	}, [color]);
	return (
		<div ref={ref}>
			<Select
				placeholder={'Select Field...'}
				options={filteredOptions}
				inputValue={searchValue}
				onInputChange={handleInputChange}
				onChange={handleChange}
				value={selectedOption}
				onFocus={() => {
					if (!menuIsOpen) toggleMenu(true);
				}}
				onBlur={() => {
					if (!selectedOption && searchValue) {
						onValueSelect(searchValue);
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
					}),
					singleValue: (base) => ({
						...base,
						opacity: 1,
					}),
					input: (base) => ({
						...base,
						input: {
							opacity: '1 !important',
						},
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
						bottom: -15,
					}}
				>{`${error}`}</ErrorMessage>
			)}
		</div>
	);
};

export default DeepSelect;
