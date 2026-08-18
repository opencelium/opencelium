import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { MethodWithId } from '../../../types/connection';
import { getIteratorsForMethod, getReferenceOptions,
	type ResponseType } from '../body-editor/requestReferenceOptions';
import type { ReferenceOption } from './ReferenceGenerator.types';
import type { useReferenceDropdowns } from './useReferenceDropdowns';

type Setter<T> = Dispatch<SetStateAction<T>>;
type Params = {
	open: boolean;
	resetKey?: number;
	defaultType: ResponseType;
	selectedMethod?: MethodWithId;
	responseType: ResponseType;
	iterators: ReturnType<typeof getIteratorsForMethod>;
	previousResetKeyRef: RefObject<string>;
	dropdowns: ReturnType<typeof useReferenceDropdowns>;
	setConnector: Setter<string>;
	setConnectorOpen: Setter<boolean>;
	setMethodId: Setter<string>;
	setResponseType: Setter<ResponseType>;
	setSearchValue: Setter<string>;
	setSelectedOption: Setter<ReferenceOption | null>;
	setFilteredOptions: Setter<ReferenceOption[]>;
};

export function useReferenceGeneratorEffects(params: Params) {
	const { t } = useI18n('workflow');
	const reset = () => {
		params.previousResetKeyRef.current = '';
		params.setConnector(''); params.setConnectorOpen(false); params.setMethodId('');
		params.setResponseType(params.defaultType); params.setSearchValue('');
		params.setSelectedOption(null); params.setFilteredOptions([]);
		params.dropdowns.setFieldPosition(null); params.dropdowns.setConnectorPosition(null);
	};
	useEffect(() => { if (!params.open) reset(); }, [params.open]);
	useEffect(() => {
		if (!params.open) return;
		reset();
		requestAnimationFrame(() => {
			try {
				params.dropdowns.fieldContainerRef.current
					?.querySelector<HTMLInputElement>('input')?.focus();
			} catch {}
		});
	}, [params.resetKey, params.open]);
	useEffect(() => {
		const method = params.selectedMethod;
		if (!method) {
			params.setSearchValue(''); params.setSelectedOption(null);
			params.setFilteredOptions([]); params.dropdowns.setFieldPosition(null); return;
		}
		const key = `${method.id}:${params.responseType}`;
		if (params.previousResetKeyRef.current === key) return;
		params.previousResetKeyRef.current = key;
		if (params.responseType === 'status') {
			params.setSearchValue('Response Status');
			params.setSelectedOption({ label: 'Response Status', value: 'status' });
			params.setFilteredOptions([]); params.dropdowns.setFieldPosition(null); return;
		}
		params.setSearchValue(''); params.setSelectedOption(null);
		params.setFilteredOptions(getReferenceOptions(method, params.responseType, '', params.iterators, t));
		params.dropdowns.setFieldPosition(null);
		requestAnimationFrame(() => { params.dropdowns.fieldInputRef.current?.focus();
			params.dropdowns.updateFieldPosition(); });
	}, [params.selectedMethod, params.responseType]);
}
