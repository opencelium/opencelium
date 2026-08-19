import type { Dispatch, SetStateAction } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { MethodWithId } from '../../../types/connection';
import { getIteratorsForMethod, getReferenceOptions, isExpandableReferencePath,
	type ResponseType } from '../body-editor/requestReferenceOptions';
import type { ReferenceOption } from './ReferenceGenerator.types';
import { getReferenceFilterTerm } from './referenceGenerator.utils';
import type { useReferenceDropdowns } from './useReferenceDropdowns';

type Setter<T> = Dispatch<SetStateAction<T>>;
type Params = { selectedMethod?: MethodWithId; responseType: ResponseType;
	iterators: ReturnType<typeof getIteratorsForMethod>;
	dropdowns: ReturnType<typeof useReferenceDropdowns>;
	setResponseType: Setter<ResponseType>; setSearchValue: Setter<string>;
	setSelectedOption: Setter<ReferenceOption | null>;
	setFilteredOptions: Setter<ReferenceOption[]> };

export function useReferenceFieldActions(params: Params) {
	const { t } = useI18n('workflow');
	const options = (type: ResponseType, value = '') => params.selectedMethod
		? getReferenceOptions(params.selectedMethod, type, value, params.iterators, t) : [];
	const changeSearch = (value: string) => {
		params.setSearchValue(value);
		if (!params.selectedMethod) return;
		if (params.responseType === 'status') {
			params.setSearchValue('Response Status');
			params.setSelectedOption({ label: 'Response Status', value: 'status' });
			return void params.setFilteredOptions([]);
		}
		if (!value) { params.setSelectedOption(null);
			return void params.setFilteredOptions(options(params.responseType)); }
		if (value === '$' || value === '$.') {
			params.setSelectedOption({ label: 'The root object', value: '$.' });
			return void params.setFilteredOptions([]);
		}
		const term = getReferenceFilterTerm(value);
		const filtered = options(params.responseType, value).filter((option) => !term
			|| option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term));
		params.setFilteredOptions(filtered);
		params.setSelectedOption(filtered.find((option) => option.value === value) ?? null);
	};
	const changeResponseType = (type: ResponseType) => {
		params.setResponseType(type);
		if (type === 'status') {
			params.setSearchValue('Response Status');
			params.setSelectedOption({ label: 'Response Status', value: 'status' });
			params.setFilteredOptions([]); return void params.dropdowns.setFieldPosition(null);
		}
		params.setSearchValue(''); params.setSelectedOption(null);
		if (params.selectedMethod) { params.setFilteredOptions(options(type));
			requestAnimationFrame(() => { params.dropdowns.fieldInputRef.current?.focus();
				params.dropdowns.updateFieldPosition(); }); }
	};
	const selectOption = (option: ReferenceOption) => {
		params.setSelectedOption(option); params.setSearchValue(option.value);
		if (!params.selectedMethod) return;
		if (option.value === '$' || option.value === '$.') {
			params.setFilteredOptions([]); return void params.dropdowns.setFieldPosition(null);
		}
		params.setFilteredOptions(isExpandableReferencePath(params.selectedMethod,
			params.responseType, option.value, params.iterators)
			? options(params.responseType, option.value) : []);
	};
	return { changeSearch, changeResponseType, selectOption };
}
