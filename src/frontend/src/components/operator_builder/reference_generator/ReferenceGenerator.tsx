import InputText from '@app_component/base/input/text/InputText';
import ReferenceFactory from '@app_component/operator_builder/classes/references/ReferenceFactory';
import WebhookReference from '@app_component/operator_builder/classes/references/WebhookReference';
import ReferenceSwitcher from '@app_component/operator_builder/reference_generator/ReferenceSwitcher';
import {findTopLeft} from '@application/utils/utils';
import WebhookGenerator from '@change_component/form_elements/form_connection/form_methods/method/WebhookGenerator';
import TooltipFontIcon
	from '@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon';
import Webhook from '@root/classes/Webhook';
import {
	addCloseParamGeneratorNavigation,
	removeCloseParamGeneratorNavigation
} from "@root/components/utils/key_navigation";
import React, {useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import DirectReference from '../classes/references/DirectReference';
import DeepSelect from './DeepSelect';
import MethodSelect from './MethodSelect';
import {ConstantComponentType, ConstantSelectOptions, ReferenceGeneratorProps, ReferenceType} from './props';
import {ConstantContainer, ReferenceGeneratorContainer} from './styles';
import IfOperatorsConfigGenerator from "@app_component/operator_builder/classes/if_operator/IfOperatorsConfigGenerator";
import LoopOperatorsConfigGenerator
	from "@app_component/operator_builder/classes/loop_operator/LoopOperatorsConfigGenerator";
import {
	AllOperatorNames,
	LoopOperatorName,
	OperatorName
} from "@app_component/operator_builder/interfaces/OperatorName";
import InputTextarea from "@app_component/base/input/textarea/InputTextarea";
import IfBaseOperator from "@app_component/operator_builder/classes/if_operator/IfBaseOperator";
import LoopBaseOperator from "@app_component/operator_builder/classes/loop_operator/LoopBaseOperator";
import Select, {StylesConfig} from "react-select";
import {ErrorColor} from "@app_component/operator_builder/OperatorBuilder";

const ReferenceGenerator = React.forwardRef(({
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
}: ReferenceGeneratorProps, ref) => {
	const [color, setColor] = useState<string>('');
	const [currentField, setCurrentField] = useState<string>('');
	const getOperatorClass = () => {
		let newOperatorClass;
		if (Object.values(LoopOperatorName).includes(operator as LoopOperatorName)) {
			const operatorsConfigGenerator = new LoopOperatorsConfigGenerator();
			newOperatorClass = operatorsConfigGenerator.getOperatorClass(operator as LoopOperatorName);
		}
		if (Object.values(AllOperatorNames).includes(operator as OperatorName)) {
			const operatorsConfigGenerator = new IfOperatorsConfigGenerator();
			newOperatorClass = operatorsConfigGenerator.getOperatorClass(operator as OperatorName);
		}
		return newOperatorClass;
	}
	const [referenceType, updateReferenceType] = useState<ReferenceType>(
		getOperatorClass()?.defaultRefType || 'direct',
	);
	const [coords, setCoords] = useState<{ top: number; left: number }>({
		top: 0,
		left: 0,
	});
	const [operatorClass, setOperatorClass] = useState<IfBaseOperator | LoopBaseOperator>();
	const referenceRef: any = useRef();
	const webhookRef: any = useRef();
	const onUpdateOperator = () => {
		const newOperatorClass = getOperatorClass();
		setOperatorClass(newOperatorClass);
		if (newOperatorClass?.defaultRefType) {
			updateReferenceType(newOperatorClass.defaultRefType);
		}
	}
	useEffect(() => {
		if (operator) {
			onUpdateOperator();
		}
	}, [operator]);
	useEffect(() => {
		if (parent) {
			addCloseParamGeneratorNavigation(this);
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleEscKey);
			return () => {
				let elem = document.getElementById(id);
				if (elem) {
					elem.innerText = '';
				}
				removeCloseParamGeneratorNavigation(this);
				document.removeEventListener('mousedown', handleClickOutside);
				document.removeEventListener('keydown', handleEscKey);
			}
		}
	}, [])
	useEffect(() => {
		setIdValue();
	}, [currentField]);
	useEffect(() => {
		if (parent && isAbsolute) {
			const { top, left } = findTopLeft(parent);
			setCoords({ top, left });
		}
	}, [parent, isAbsolute]);

	const handleEscKey = (event: any) => {
		if (editCancel && event.key === 'Escape' || event.keyCode === 27) {
			editCancel();
		}
	}
	const handleClickOutside = (event: any) => {
		const addParamElem = document.getElementById('add_param_dialog');
		const addParamFade = addParamElem ? addParamElem.parentElement : null;
		const updateParamElem = document.getElementById('update_param_dialog');
		const updateParamFade = updateParamElem ? updateParamElem.parentElement : null;
		const webhookGeneratorElem = document.getElementById('webhook_generator_dialog');
		const webhookGeneratorFade = webhookGeneratorElem ? webhookGeneratorElem.parentElement : null;
		const selectSearch = document.getElementById(`param_generator_${connectionEditor.item.index}`);
		if (selectSearch) {
			if (document.activeElement?.id === selectSearch.id){
				return;
			}
		}
		if (referenceRef.current && !referenceRef.current.contains(event.target)
			&& (!webhookRef.current || !webhookRef.current.contains(event.target))
			&& (!webhookGeneratorElem || !webhookGeneratorElem.contains(event.target))
			&& (!webhookGeneratorFade || !webhookGeneratorFade.contains(event.target))
			&& (!addParamElem || !addParamElem.contains(event.target))
			&& (!addParamFade || !addParamFade.contains(event.target))
			&& (!updateParamElem || !updateParamElem.contains(event.target))
			&& (!updateParamFade || !updateParamFade.contains(event.target))) {
			if(editCancel) {
				editCancel();
			}
		}
	}
	const changeReferenceType = (newReferenceType: ReferenceType) => {
		updateReferenceType(newReferenceType);
		setColor('');
		setCurrentField('');
	};
	const onColorSelect = (newColor: string) => {
		setColor(newColor);
		setCurrentField('');
		if (isBuilder) {
			setReference('');
		}
	};
	const onFieldSelect = (newField: string) => {
		setCurrentField(newField);
	};
	useEffect(() => {
		if(!manualAdd){
			applyReference();
		}
	}, [currentField, manualAdd]);
	const applyReference = () => {
		let newReference = '';
		if (currentField !== '') {
			newReference = ReferenceFactory.getReference(
				referenceType,
				currentField,
				color,
				'response'
			);
			if (newReference !== reference) {
				setReference(newReference);
			}
		}
	};
	const getComputedReference = () => {
		if (currentField !== '') {
			let reference = ReferenceFactory.getReference(
				referenceType,
				currentField,
				color,
				'response'
			);
			if (reference.length > 3) {
				if (reference.indexOf('{%') === 0 && reference[reference.length - 2] === '%' && reference[reference.length - 1] === '}') {
					reference = reference.substring(2, reference.length - 2);
				}
			}
			return reference;
		}
		return '';
	};

	const setIdValue = () => {
		const computedRef = getComputedReference();
		let elem = document.getElementById(id);
		if (computedRef !== '') {
			if (elem) {
				elem.innerText = computedRef;
			}
		}
	}
	useImperativeHandle(ref, () => ({
    setIdValue
  }));

	useEffect(() => {
		if (reference) {
			const referenceInstance = ReferenceFactory.createReferenceInstance(
				reference
			);
			if (referenceInstance) {
				const referenceData = referenceInstance.extractData();
				if (referenceInstance instanceof DirectReference) {
					setColor(referenceData.color);
					setCurrentField(referenceData.field);
					if (referenceType !== 'direct') {
						updateReferenceType('direct');
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
		} else {
			setCurrentField('');
			onUpdateOperator();
		}
	}, [reference]);

	const containerStyle = parent && isAbsolute
		? { top: coords.top + 10, left: coords.left }
		: {};
	const customSelectStyles: StylesConfig<ConstantSelectOptions, false> = {
		menuPortal: (base) => ({ ...base, zIndex: 10000 }),
	};
	const renderGenerator = () => {
		return (
			<ReferenceGeneratorContainer
				referenceType={referenceType}
				style={{...containerStyle, ...style}}
				isAbsolute={isAbsolute}
				parent={parent}
				endpointReference={endpointReference}
				ref={referenceRef}
				manualAdd={manualAdd}
			>
				{!endpointReference &&
					<ReferenceSwitcher
						hasNotConstant={bodyReference || headerReference}
						referenceType={referenceType}
						changeReferenceType={changeReferenceType}
					/>
				}
				{referenceType === 'direct' && (
					<React.Fragment>
						<MethodSelect
							error={error}
							connectionEditor={connectionEditor}
							methodColor={color}
							onMethodSelect={onColorSelect}
						/>
						<DeepSelect
							error={error}
							color={color}
							connectionEditor={connectionEditor}
							field={currentField}
							onValueSelect={onFieldSelect}
						/>
					</React.Fragment>
				)}
				{referenceType === 'webhook' && (
					<WebhookGenerator
						ref={webhookRef}
						error={error}
						value={Webhook.extractFromSnippet(currentField)}
						style={{ float: 'left' }}
						onSelect={(webhookValue) => {
							onFieldSelect(Webhook.embraceWithSnippet(webhookValue));
						}}
					/>
				)}
				{referenceType === 'constant' && (
					<ConstantContainer>
						{operatorClass?.defaultConstantType === ConstantComponentType.Textarea ?
							<InputTextarea
								style={{resize: 'vertical'}}
								minHeight={'35px'}
								value={currentField}
								onChange={(e) => setCurrentField(e.target.value)}
								placeholder={operatorClass?.placeholder || 'Constant'}
							/>
							:
							operatorClass?.defaultConstantType === ConstantComponentType.Select ?
								<Select
									value={operatorClass?.selectOptions.find(option => option.value === currentField)}
									onChange={(selected) => setCurrentField(selected.value)}
									options={operatorClass?.selectOptions || []}
									styles={customSelectStyles}
									menuPortalTarget={document.body}
									menuPosition="absolute"
								/>
							:
							<InputText
								inputHeight={'40px'}
								minHeight={'35px'}
								value={currentField}
								onChange={(e) => setCurrentField(e.target.value)}
								placeholder={operatorClass?.placeholder || 'Constant'}
							/>
						}
					</ConstantContainer>
				)}
				{manualAdd && (
					<TooltipFontIcon
						id={`param_generator_add_${connectionEditor.connector.getConnectorType()}_${
							connectionEditor.item.index
						}`}
						isButton={true}
						tooltip={actionButtonTooltip}
						value={actionButtonValue}
						onClick={(e: any) => {
							if(submitEdit){
								submitEdit(e);
							}
							else{
								const computedRef = getComputedReference();
								if (computedRef) {
									setReference(computedRef);
								}
							}
						}}
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
	} else {
		return renderGenerator();
	}
});

export default ReferenceGenerator;
