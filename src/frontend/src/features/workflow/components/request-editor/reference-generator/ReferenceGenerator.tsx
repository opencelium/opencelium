import React, { useMemo, useRef } from 'react';
import { Button } from 'antd';
import {
	buildReferenceValue,
	getIteratorsForMethod,
	getReferenceOptions,
	type ResponseType,
} from '../body-editor/requestReferenceOptions';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import '../body-editor/bodyLegacy.css';
import type { ReferenceGeneratorProps } from './ReferenceGenerator.types';
import { useReferenceMethods } from './useReferenceMethods';
import { useReferenceDropdowns } from './useReferenceDropdowns';
import { ReferenceFieldDropdown } from './ReferenceFieldDropdown/ReferenceFieldDropdown';
import { ReferenceConnectorDropdown } from './ReferenceConnectorDropdown/ReferenceConnectorDropdown';
import { ReferenceConnectorSelect } from './ReferenceConnectorSelect/ReferenceConnectorSelect';
import { ReferenceMethodFieldControls } from './ReferenceMethodFieldControls/ReferenceMethodFieldControls';
import { useReferenceGeneratorEffects } from './useReferenceGeneratorEffects';
import { useReferenceFieldActions } from './useReferenceFieldActions';
import './referenceGenerator.css';
import { useReferenceGeneratorSelection } from './useReferenceGeneratorSelection';
const ReferenceGenerator: React.FC<ReferenceGeneratorProps> = ({
	open,
	connection,
	currentMethod,
	onClose,
	onApply,
	resetKey,
	allowResponseTypes = ['body'],
}) => {
	const { t } = useI18n('workflow');
	const defaultResponseType: ResponseType = allowResponseTypes[0] ?? 'body';
	const selection = useReferenceGeneratorSelection(defaultResponseType);
	const { selectedConnector, setSelectedConnector, isConnectorDropdownOpen,
		setIsConnectorDropdownOpen, selectedMethodId, setSelectedMethodId,
		searchValue, setSearchValue, selectedOption, setSelectedOption,
		filteredOptions, setFilteredOptions, responseType, setResponseType } = selection;
	const { connectorOptions, methods, methodOptions } = useReferenceMethods(
		connection, currentMethod, selectedConnector);
	const selectedMethod = useMemo(
		() => methods.find((m) => m.id === selectedMethodId),
		[methods, selectedMethodId],
	);
	const previousFieldResetKeyRef = useRef('');
	const currentMethodIterators = useMemo(
		() => (connection ? getIteratorsForMethod(connection, currentMethod) : []),
		[connection, currentMethod],
	);
	const isDropdownOpen = !!selectedMethod && filteredOptions.length > 0;
	const isConnectorListOpen = isConnectorDropdownOpen && connectorOptions.length > 0;
	const dropdowns = useReferenceDropdowns({ fieldOpen: isDropdownOpen,
		connectorOpen: isConnectorListOpen, setConnectorOpen: setIsConnectorDropdownOpen });
	useReferenceGeneratorEffects({ open, resetKey, defaultType: allowResponseTypes[0] ?? 'body',
		selectedMethod, responseType, iterators: currentMethodIterators,
		previousResetKeyRef: previousFieldResetKeyRef, dropdowns,
		setConnector: setSelectedConnector, setConnectorOpen: setIsConnectorDropdownOpen,
		setMethodId: setSelectedMethodId, setResponseType, setSearchValue,
		setSelectedOption, setFilteredOptions });
	const fieldActions = useReferenceFieldActions({ selectedMethod, responseType,
		iterators: currentMethodIterators, dropdowns, setResponseType, setSearchValue,
		setSelectedOption, setFilteredOptions });
	if (!open) return null;
	const handleApply = () => {
		if (!selectedMethod) return;
		const finalPath = selectedOption?.value || searchValue.trim();
		if (!finalPath) return;
		const reference = buildReferenceValue(selectedMethod.color, responseType, finalPath);
		onApply(reference);
	};
	const canInsert = !!selectedMethod && !!(selectedOption || searchValue.trim());

	const methodPlaceholder = methods.length
		? t('placeholders.selectMethod')
		: t('placeholders.noPreviousMethods');

	const selectedConnectorLabel = selectedConnector || t('placeholders.selectConnector');
	const fieldPlaceholder = !selectedMethod ? t('placeholders.selectMethodFirst')
		: responseType === 'status' ? t('references.responseStatus') : t('placeholders.selectField');
	const handleFieldFocus = () => {
		if (!selectedMethod || responseType === 'status') return;
		setFilteredOptions(getReferenceOptions(selectedMethod, responseType,
			searchValue.trim(), currentMethodIterators, t));
		dropdowns.updateFieldPosition();
	};

	return (
		<>
			<div className='referenceGeneratorBox'>
				<div className='referenceGeneratorFields'>
					<ReferenceConnectorSelect containerRef={dropdowns.connectorSelectRef}
						label={t('refGenerator.connector')} value={selectedConnector}
						placeholder={selectedConnectorLabel} open={isConnectorDropdownOpen}
						disabled={!connectorOptions.length}
						onToggle={() => setIsConnectorDropdownOpen((current) => !current)} />
					<ReferenceMethodFieldControls methodLabel={t('refGenerator.method')}
						fieldLabel={t('refGenerator.field')} methodId={selectedMethodId}
						methodOptions={methodOptions} methodPlaceholder={methodPlaceholder}
						methodDisabled={!selectedConnector || !methods.length}
						onMethodChange={selection.selectMethod}
						fieldContainerRef={dropdowns.fieldContainerRef}
						fieldInputRef={dropdowns.fieldInputRef} responseTypes={allowResponseTypes}
						responseType={responseType} onResponseTypeChange={fieldActions.changeResponseType}
						searchValue={searchValue} onSearchChange={fieldActions.changeSearch}
						onFieldFocus={handleFieldFocus} onFieldBlur={() => {
							setFilteredOptions([]); dropdowns.setFieldPosition(null);
						}} fieldPlaceholder={fieldPlaceholder}
						fieldDisabled={!selectedMethod || responseType === 'status'} />
				</div>
				<div className='referenceGeneratorActions'>
					<Button onClick={onClose}>{t('actions.cancel')}</Button>
					<Button type='primary' onClick={handleApply} disabled={!canInsert}>
						Insert
					</Button>
				</div>
			</div>

			<ReferenceFieldDropdown open={isDropdownOpen} position={dropdowns.fieldPosition}
				dropdownRef={dropdowns.fieldDropdownRef} options={filteredOptions}
				onSelect={fieldActions.selectOption} />
			<ReferenceConnectorDropdown open={isConnectorListOpen}
				position={dropdowns.connectorPosition} dropdownRef={dropdowns.connectorDropdownRef}
				options={connectorOptions} onSelect={selection.selectConnector} />
		</>
	);
};

export default ReferenceGenerator;
