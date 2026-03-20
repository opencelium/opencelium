import InputText from '@app_component/base/input/text/InputText';
import InputTextarea from '@app_component/base/input/textarea/InputTextarea';
import IfBaseOperator from '@app_component/operator_builder/classes/if_operator/IfBaseOperator';
import IfOperatorsConfigGenerator from '@app_component/operator_builder/classes/if_operator/IfOperatorsConfigGenerator';
import Like from '@app_component/operator_builder/classes/if_operator/types/Like';
import LoopBaseOperator from '@app_component/operator_builder/classes/loop_operator/LoopBaseOperator';
import LoopOperatorsConfigGenerator from '@app_component/operator_builder/classes/loop_operator/LoopOperatorsConfigGenerator';
import ReferenceFactory from '@app_component/operator_builder/classes/references/ReferenceFactory';
import WebhookReference from '@app_component/operator_builder/classes/references/WebhookReference';
import {
	AllOperatorNames,
	LoopOperatorName,
	OperatorName,
} from '@app_component/operator_builder/interfaces/OperatorName';
import ReferenceSwitcher from '@app_component/operator_builder/reference_generator/ReferenceSwitcher';
import { findTopLeft } from '@application/utils/utils';
import WebhookGenerator from '@change_component/form_elements/form_connection/form_methods/method/WebhookGenerator';
import TooltipFontIcon from '@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon';
import Webhook from '@root/classes/Webhook';
import {
	addCloseParamGeneratorNavigation,
	removeCloseParamGeneratorNavigation,
} from '@root/components/utils/key_navigation';
import React, {
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import ReactDOM from 'react-dom';
import Select, { StylesConfig } from 'react-select';
import DirectReference from '../classes/references/DirectReference';
import MethodSelect from './MethodSelect';
import {
	APIResponseType,
	ConstantComponentType,
	ConstantSelectOptions,
	ReferenceGeneratorProps,
	ReferenceType,
} from './props';
import {
	ConstantContainer,
	LikePercentageContainer,
	ReferenceGeneratorContainer,
} from './styles';
import APIResponseSwitcher from "@app_component/operator_builder/reference_generator/APIResponseSwitcher";
import ApiResponseSelect from "@app_component/operator_builder/reference_generator/selects/APIResponseSelect";

export const EmptyString = '&nbsp';

const customSelectStyles: StylesConfig<ConstantSelectOptions, false> = {
	menuPortal: (base) => ({ ...base, zIndex: 10000 }),
};

const ReferenceGenerator = React.forwardRef(
	(
		{
			reference,
			setReference,
			connectionEditor,
			parent,
			isAbsolute,
			manualAdd = false,
			actionButtonTooltip,
			actionButtonValue,
			submitEdit,
			editCancel,
			id,
			endpointReference = false,
			bodyReference = false,
			headerReference = false,
			isBuilder = false,
			error = '',
			style = {},
			operator,
			onNamespacesChange
		}: ReferenceGeneratorProps,
		ref
	) => {
		const [color, setColor] = useState<string>('');
		const [currentField, setCurrentField] = useState<string>('');
		const [hasOpenPerc, toggleOpenPerc] = useState<boolean>(false);
		const [hasClosedPerc, toggleClosedPerc] = useState<boolean>(false);
		const getOperatorClass = useCallback(() => {
			let newOperatorClass;
			if (
				Object.values(LoopOperatorName).includes(operator as LoopOperatorName)
			) {
				const operatorsConfigGenerator = new LoopOperatorsConfigGenerator();
				newOperatorClass = operatorsConfigGenerator.getOperatorClass(
					operator as LoopOperatorName
				);
			}
			if (Object.values(AllOperatorNames).includes(operator as OperatorName)) {
				const operatorsConfigGenerator = new IfOperatorsConfigGenerator();
				newOperatorClass = operatorsConfigGenerator.getOperatorClass(
					operator as OperatorName
				);
			}
			return newOperatorClass;
		}, [operator]);

		const [referenceType, updateReferenceType] = useState<ReferenceType>(
			getOperatorClass()?.defaultRefType || 'direct'
		);
		const [apiResponseType, updateAPIResponseType] = useState<APIResponseType>(
			getOperatorClass()?.defaultAPIResponseType || 'body'
		);
		const [coords, setCoords] = useState<{ top: number; left: number }>({
			top: 0,
			left: 0,
		});
		const [operatorClass, setOperatorClass] = useState<
			IfBaseOperator | LoopBaseOperator
		>();
		const referenceRef: any = useRef();
		const webhookRef: any = useRef();

		const isLikeOperator = useCallback((): boolean => {
			return referenceType !== 'webhook' && Like.isLikeOperator(operator);
		}, [referenceType, operator]);

		const onUpdateOperator = useCallback(() => {
			const newOperatorClass = getOperatorClass();
			setOperatorClass(newOperatorClass);
			if (newOperatorClass?.defaultRefType) {
				updateReferenceType(newOperatorClass.defaultRefType);
			}
		}, [getOperatorClass]);

		const getComputedReference = useCallback(() => {
			if (currentField !== '' || apiResponseType === 'status') {
				let computedReference = ReferenceFactory.getReference(
					referenceType,
					currentField,
					color,
					'response',
					apiResponseType
				);

				if (computedReference.length > 3) {
					if (
						computedReference.indexOf('{%') === 0 &&
						computedReference[computedReference.length - 2] === '%' &&
						computedReference[computedReference.length - 1] === '}'
					) {
						computedReference = computedReference.substring(2, computedReference.length - 2);
					}
				}

				return computedReference;
			}

			return '';
		}, [apiResponseType, color, currentField, referenceType]);

		const applyReference = useCallback(() => {
			if (apiResponseType !== 'status' && !currentField) return;

			let newReference = ReferenceFactory.getReference(
				referenceType,
				currentField,
				color,
				'response',
				apiResponseType
			);

			if (isLikeOperator()) {
				if (hasOpenPerc && !newReference.startsWith('%')) {
					newReference = `%${newReference}`;
				}
				if (hasClosedPerc && !newReference.endsWith('%')) {
					newReference = `${newReference}%`;
				}
			}

			if (newReference !== reference) {
				setReference(newReference);
			}
		}, [
			apiResponseType,
			color,
			currentField,
			hasClosedPerc,
			hasOpenPerc,
			isLikeOperator,
			reference,
			referenceType,
			setReference,
		]);

		const setIdValue = useCallback(() => {
			const computedRef = getComputedReference();
			const elem = document.getElementById(id);

			if (computedRef !== '' && elem) {
				elem.innerText = computedRef;
			}
		}, [getComputedReference, id]);

		const handleEscKey = useCallback((event: any) => {
			if ((editCancel && event.key === 'Escape') || event.keyCode === 27) {
				editCancel();
			}
		}, [editCancel]);
		const handleClickOutside = useCallback((event: any) => {
			const addParamElem = document.getElementById('add_param_dialog');
			const addParamFade = addParamElem ? addParamElem.parentElement : null;
			const updateParamElem = document.getElementById('update_param_dialog');
			const updateParamFade = updateParamElem ? updateParamElem.parentElement : null;
			const webhookGeneratorElem = document.getElementById('webhook_generator_dialog');
			const webhookGeneratorFade = webhookGeneratorElem ? webhookGeneratorElem.parentElement : null;
			const selectSearch = document.getElementById(
				`param_generator_${connectionEditor.item.index}`
			);
			if (selectSearch) {
				if (document.activeElement?.id === selectSearch.id) {
					return;
				}
			}
			if (
				referenceRef.current &&
				!referenceRef.current.contains(event.target) &&
				(!webhookRef.current || !webhookRef.current.contains(event.target)) &&
				(!webhookGeneratorElem || !webhookGeneratorElem.contains(event.target)) &&
				(!webhookGeneratorFade || !webhookGeneratorFade.contains(event.target)) &&
				(!addParamElem || !addParamElem.contains(event.target)) &&
				(!addParamFade || !addParamFade.contains(event.target)) &&
				(!updateParamElem || !updateParamElem.contains(event.target)) &&
				(!updateParamFade || !updateParamFade.contains(event.target))
			) {
				if (editCancel) {
					editCancel();
				}
			}
		}, [connectionEditor.item.index, editCancel]);

		const changeReferenceType = useCallback((newReferenceType: ReferenceType) => {
			updateReferenceType(newReferenceType);
			setColor('');
			if (newReferenceType === 'constant') {
				setCurrentField(EmptyString);
			} else {
				setCurrentField('');
			}
		}, []);

		const changeApiResponseType = useCallback((newType: APIResponseType) => {
			updateAPIResponseType(newType);
			setCurrentField('');

			if (isBuilder) {
				setReference('');
			}
		}, [isBuilder, setReference]);

		const onColorSelect = useCallback((newColor: string) => {
			setColor(newColor);
			setCurrentField('');

			if (isBuilder) {
				setReference('');
			}
		}, [isBuilder, setReference]);

		const onFieldSelect = useCallback((newField: string, structure?: object) => {
			setCurrentField(newField);

			if (structure && onNamespacesChange) {
				onNamespacesChange(structure);
			}
		}, [onNamespacesChange]);

		const handleConstantInputChange = useCallback((e: any) => {
			setCurrentField(
				`${hasOpenPerc ? '%' : ''}${e.target.value}${hasClosedPerc ? '%' : ''}`
			);
		}, [hasClosedPerc, hasOpenPerc]);

		const handleConstantSelectChange = useCallback((selected: any) => {
			setCurrentField(selected.value);
		}, []);

		const handleWebhookSelect = useCallback((webhookValue: string) => {
			onFieldSelect(Webhook.embraceWithSnippet(webhookValue));
		}, [onFieldSelect]);

		const handleManualAdd = useCallback((e: any) => {
			if (submitEdit) {
				submitEdit(e);
			} else {
				const computedRef = getComputedReference();
				if (computedRef) {
					setReference(computedRef);
				}
			}
		}, [getComputedReference, setReference, submitEdit]);

		useImperativeHandle(ref, () => ({
			setIdValue,
		}));

		useEffect(() => {
			switch (referenceType) {
				case 'constant':
					if (hasOpenPerc) {
						if (currentField && currentField[0] !== '%') {
							const newVal = currentField === EmptyString ? '%' : `%${currentField}`;
							if (newVal !== currentField) setCurrentField(newVal);
						}
					} else {
						if (currentField && currentField[0] === '%') {
							const newVal = currentField.substring(1);
							if (newVal !== currentField) setCurrentField(newVal);
						}
					}
					break;
				case 'direct':
					if (hasOpenPerc) {
						if (reference && !reference.startsWith('%')) {
							setReference(reference === EmptyString ? '%' : `%${reference}`);
						}
					} else {
						if (reference && reference.startsWith('%')) {
							setReference(reference.substring(1));
						}
					}
					break;
				default:
					break;
			}
		}, [hasOpenPerc, currentField, reference, referenceType, setReference]);

		useEffect(() => {
			switch (referenceType) {
				case 'constant':
					if (hasClosedPerc) {
						if (currentField && currentField[currentField.length - 1] !== '%') {
							const newVal = currentField === EmptyString ? '%' : `${currentField}%`;
							if (newVal !== currentField) setCurrentField(newVal);
						}
					} else {
						if (currentField && currentField[currentField.length - 1] === '%') {
							const newVal = currentField.slice(0, -1);
							if (newVal !== currentField) setCurrentField(newVal);
						}
					}
					break;
				case 'direct':
					if (hasClosedPerc) {
						if (reference && !reference.endsWith('%')) {
							setReference(reference === EmptyString ? '%' : `${reference}%`);
						}
					} else {
						if (reference && reference.endsWith('%')) {
							setReference(reference.substring(0, reference.length - 1));
						}
					}
					break;
				case 'webhook':
					break;
				default:
					break;
			}
		}, [hasClosedPerc, currentField, reference, referenceType, setReference]);

		useEffect(() => {
			if (hasOpenPerc) {
				toggleOpenPerc(false);
			}
			if (hasClosedPerc) {
				toggleClosedPerc(false);
			}
		}, [referenceType]);

		useEffect(() => {
			if (operator) {
				onUpdateOperator();
			}
		}, [operator, onUpdateOperator]);

		useEffect(() => {
			if (parent) {
				addCloseParamGeneratorNavigation(this as any);
				document.addEventListener('mousedown', handleClickOutside);
				document.addEventListener('keydown', handleEscKey);

				return () => {
					const elem = document.getElementById(id);
					if (elem) {
						elem.innerText = '';
					}
					removeCloseParamGeneratorNavigation(this as any);
					document.removeEventListener('mousedown', handleClickOutside);
					document.removeEventListener('keydown', handleEscKey);
				};
			}
		}, [handleClickOutside, handleEscKey, id, parent]);

		useEffect(() => {
			setIdValue();

			if (referenceType === 'constant') {
				if (isLikeOperator()) {
					if (!hasOpenPerc) {
						if (currentField[0] === '%') {
							toggleOpenPerc(true);
						}
					}
					if (!hasClosedPerc) {
						if (
							currentField.length > 1 &&
							currentField[currentField.length - 1] === '%'
						) {
							toggleClosedPerc(true);
						}
					}
				}
			}
		}, [currentField, hasClosedPerc, hasOpenPerc, isLikeOperator, referenceType, setIdValue]);

		useEffect(() => {
			if (parent && isAbsolute) {
				const { top, left } = findTopLeft(parent);
				setCoords({ top, left });
			}
		}, [parent, isAbsolute]);

		useEffect(() => {
			if (!manualAdd) {
				applyReference();
			}
		}, [applyReference, manualAdd]);

		useEffect(() => {
			if (apiResponseType === 'status') {
				if (manualAdd) {
					setIdValue();
				} else {
					applyReference();
				}
			}
		}, [apiResponseType, applyReference, manualAdd, setIdValue]);

		useEffect(() => {
			if (reference) {
				const referenceInstance = ReferenceFactory.createReferenceInstance(reference);
				if (referenceInstance) {
					const referenceData = referenceInstance.extractData();
					if (referenceInstance instanceof DirectReference) {
						setColor(referenceData.color);
						setCurrentField(referenceData.field);
						updateAPIResponseType(referenceData.apiResponseType);
						if (referenceType !== 'direct') {
							updateReferenceType('direct');
						} else {
							if (isLikeOperator()) {
								if (hasOpenPerc) {
									if (!reference.startsWith('%')) {
										setReference(`%${reference}`);
									}
								} else if (reference.startsWith('%')) {
									toggleOpenPerc(true);
								}
								if (hasClosedPerc) {
									if (!reference.endsWith('%')) {
										setReference(`${reference}%`);
									}
								} else if (reference.endsWith('%')) {
									toggleClosedPerc(true);
								}
							}
						}
					}
					if (referenceInstance instanceof WebhookReference) {
						setColor('');
						setCurrentField(referenceInstance.reference);
						if (referenceType !== 'webhook') {
							updateReferenceType('webhook');
						}
					}
				} else {
					setColor('');
					setCurrentField(reference);
					if (referenceType !== 'constant') {
						updateReferenceType('constant');
					}
				}
			}
		}, [
			hasClosedPerc,
			hasOpenPerc,
			isLikeOperator,
			reference,
			referenceType,
			setReference,
		]);

		const containerStyle = useMemo(
			() => (parent && isAbsolute ? { top: coords.top + 10, left: coords.left } : {}),
			[parent, isAbsolute, coords.top, coords.left]
		);

		let inputTextValue = currentField === EmptyString ? '' : currentField;
		if (isLikeOperator()) {
			if (inputTextValue) {
				if (inputTextValue[0] === '%') {
					inputTextValue = inputTextValue.substring(1);
				}
				if (inputTextValue[inputTextValue.length - 1] === '%') {
					inputTextValue = inputTextValue.substring(
						0,
						inputTextValue.length - 1
					);
				}
			}
		}

		const renderGenerator = () => {
			return (
				<ReferenceGeneratorContainer
					apiResponseType={apiResponseType}
					referenceType={referenceType}
					style={{ ...containerStyle, ...style }}
					isAbsolute={isAbsolute}
					parent={parent}
					endpointReference={endpointReference}
					ref={referenceRef}
					manualAdd={manualAdd}
					isLikeOperator={isLikeOperator()}
				>
					{!endpointReference && (
						<ReferenceSwitcher
							hasNotConstant={bodyReference || headerReference}
							referenceType={referenceType}
							changeReferenceType={changeReferenceType}
						/>
					)}
					{isLikeOperator() && (
						<LikePercentageContainer
							hasSign={hasOpenPerc}
							onClick={() => {
								toggleOpenPerc(!hasOpenPerc);
							}}
						>
							<div>%</div>
						</LikePercentageContainer>
					)}
					{referenceType === 'direct' && (
						<React.Fragment>
							<MethodSelect
								error={error}
								connectionEditor={connectionEditor}
								methodColor={color}
								onMethodSelect={onColorSelect}
							/>
							<APIResponseSwitcher
								type={apiResponseType}
								changeType={changeApiResponseType}
							/>
							<ApiResponseSelect
								selectProps={{
									error,
									color,
									connectionEditor,
									field: currentField,
									onValueSelect: onFieldSelect,
								}}
								apiResponseType={apiResponseType}
							/>
						</React.Fragment>
					)}
					{referenceType === 'webhook' && (
						<WebhookGenerator
							ref={webhookRef}
							error={error}
							value={Webhook.extractFromSnippet(currentField)}
							style={{ float: 'left' }}
							onSelect={handleWebhookSelect}
						/>
					)}
					{referenceType === 'constant' && (
						<ConstantContainer>
							{operatorClass?.defaultConstantType === ConstantComponentType.Textarea ? (
								<InputTextarea
									style={{ resize: 'vertical' }}
									minHeight={'35px'}
									value={currentField === EmptyString ? '' : currentField}
									onChange={(e) => setCurrentField(e.target.value)}
									placeholder={operatorClass?.placeholder || 'Constant'}
								/>
							) : operatorClass?.defaultConstantType === ConstantComponentType.Select ? (
								<Select
									value={operatorClass?.selectOptions.find(
										(option) => option.value === currentField
									)}
									onChange={handleConstantSelectChange}
									options={operatorClass?.selectOptions || []}
									styles={customSelectStyles}
									menuPortalTarget={document.body}
									menuPosition='absolute'
								/>
							) : (
								<InputText
									inputHeight={'40px'}
									minHeight={'35px'}
									value={inputTextValue}
									onChange={handleConstantInputChange}
									placeholder={operatorClass?.placeholder || 'Constant'}
								/>
							)}
						</ConstantContainer>
					)}
					{isLikeOperator() && (
						<LikePercentageContainer
							hasSign={hasClosedPerc}
							onClick={() => toggleClosedPerc(!hasClosedPerc)}
						>
							<div>%</div>
						</LikePercentageContainer>
					)}
					{manualAdd && (
						<TooltipFontIcon
							id={`param_generator_add_${connectionEditor.connector.getConnectorType()}_${connectionEditor.item.index}`}
							isButton={true}
							tooltip={actionButtonTooltip}
							value={actionButtonValue}
							onClick={handleManualAdd}
						/>
					)}
				</ReferenceGeneratorContainer>
			);
		};

		if (parent) {
			return ReactDOM.createPortal(
				renderGenerator(),
				document.getElementById('oc_generator_modal')
			);
		}

		return renderGenerator();
	}
);

export default ReferenceGenerator;