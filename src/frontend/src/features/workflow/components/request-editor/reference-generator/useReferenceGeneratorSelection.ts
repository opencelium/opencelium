import { useState } from 'react';
import type { ResponseType } from '../body-editor/requestReferenceOptions';
import type { ReferenceOption } from './ReferenceGenerator.types';

export const useReferenceGeneratorSelection = (defaultResponseType: ResponseType) => {
	const [selectedConnector, setSelectedConnector] = useState('');
	const [isConnectorDropdownOpen, setIsConnectorDropdownOpen] = useState(false);
	const [selectedMethodId, setSelectedMethodId] = useState('');
	const [searchValue, setSearchValue] = useState('');
	const [selectedOption, setSelectedOption] = useState<ReferenceOption | null>(null);
	const [filteredOptions, setFilteredOptions] = useState<ReferenceOption[]>([]);
	const [responseType, setResponseType] = useState<ResponseType>(defaultResponseType);
	const resetField = () => {
		setSearchValue('');
		setSelectedOption(null);
		setFilteredOptions([]);
	};
	const selectMethod = (id: string) => {
		setSelectedMethodId(id);
		resetField();
	};
	const selectConnector = (value: string) => {
		setSelectedConnector(value);
		setIsConnectorDropdownOpen(false);
		setSelectedMethodId('');
		resetField();
	};

	return {
		selectedConnector, setSelectedConnector,
		isConnectorDropdownOpen, setIsConnectorDropdownOpen,
		selectedMethodId, setSelectedMethodId,
		searchValue, setSearchValue, selectedOption, setSelectedOption,
		filteredOptions, setFilteredOptions, responseType, setResponseType,
		selectMethod, selectConnector,
	};
};
