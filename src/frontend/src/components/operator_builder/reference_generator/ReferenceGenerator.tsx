import InputText from '@app_component/base/input/text/InputText';
import ReferenceFactory from '@app_component/operator_builder/classes/references/ReferenceFactory';
import WebhookReference from '@app_component/operator_builder/classes/references/WebhookReference';
import ReferenceSwitcher from '@app_component/operator_builder/reference_generator/ReferenceSwitcher';
import { findTopLeft } from '@application/utils/utils';
import WebhookGenerator from '@change_component/form_elements/form_connection/form_methods/method/WebhookGenerator';
import TooltipFontIcon from '@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon';
import Webhook from '@root/classes/Webhook';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import DirectReference from '../classes/references/DirectReference';
import DeepSelect from './DeepSelect';
import MethodSelect from './MethodSelect';
import { ReferenceGeneratorProps, ReferenceType } from './props';
import { ConstantContainer, ReferenceGeneratorContainer } from './styles';

const ReferenceGenerator = ({
	reference,
	setReference,
	connectionEditor,
	parent,
	isAbsolute,
	manualAdd = false,
	actionButtonTooltip,
	actionButtonValue,
	submitEdit,
	endpointReference = false
}: ReferenceGeneratorProps) => {
	const [color, setColor] = useState<string>('');
	const [currentField, setCurrentField] = useState<string>('');
	const [referenceType, updateReferenceType] = useState<ReferenceType>(
		'direct'
	);
	const [coords, setCoords] = useState<{ top: number; left: number }>({
		top: 0,
		left: 0,
	});

	useEffect(() => {
		if (parent && isAbsolute) {
			const { top, left } = findTopLeft(parent);
			setCoords({ top, left });
		}
	}, [parent, isAbsolute]);

	const changeReferenceType = (newReferenceType: ReferenceType) => {
		updateReferenceType(newReferenceType);
		setColor('');
		setCurrentField('');
	};
	const onColorSelect = (newColor: string) => {
		setColor(newColor);
		setCurrentField('');
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
			return ReferenceFactory.getReference(
				referenceType,
				currentField,
				color,
				'response'
			);
		}
		return '';
	};
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
		}
	}, [reference]);

	const containerStyle = parent && isAbsolute
		? { top: coords.top + 10, left: coords.left }
		: {};
    
	const renderGenerator = () => {
		return (
			<ReferenceGeneratorContainer
				referenceType={referenceType}
				style={containerStyle}
				isAbsolute={isAbsolute}
				parent={parent}
				endpointReference={endpointReference}
			>
				{!endpointReference && 
					<ReferenceSwitcher
					referenceType={referenceType}
					changeReferenceType={changeReferenceType}
				/>
				}
				{referenceType === 'direct' && (
					<React.Fragment>
						<MethodSelect
							connectionEditor={connectionEditor}
							methodColor={color}
							onMethodSelect={onColorSelect}
						/>
						<DeepSelect
							color={color}
							connectionEditor={connectionEditor}
							field={currentField}
							onValueSelect={onFieldSelect}
						/>
					</React.Fragment>
				)}
				{referenceType === 'webhook' && (
					<WebhookGenerator
						value={Webhook.extractFromSnippet(currentField)}
						style={{ float: 'left' }}
						onSelect={(webhookValue) => {
							onFieldSelect(Webhook.embraceWithSnippet(webhookValue));
						}}
					/>
				)}
				{referenceType === 'constant' && (
					<ConstantContainer>
						<InputText
							minHeight={'35px'}
							value={currentField}
							onChange={(e) => setCurrentField(e.target.value)}
							placeholder={'Constant'}
						/>
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
};

export default ReferenceGenerator;
