import TooltipFontIcon from '@basic_components/tooltips/TooltipFontIcon';
import {
	FieldBindingBlockStyled,
	FieldBindingsBlockStyled,
	ReferenceBlockStyled,
	ReferenceInformationStyled,
	SourceFieldStyled,
	SourceMethodNameStyled,
	TargetFieldStyled,
} from '@change_component/form_elements/form_connection/form_svg/details/description/technical_process/reference_information/styles';
import CFieldBinding from '@classes/content/connection/field_binding/CFieldBinding';
import React, {FC, useEffect, useRef, useState} from 'react';
import { Reference, ReferenceInformationProps } from './interfaces';
import HelpIcon from "@app_component/base/tour/HelpIcon";
import {ReferenceInfoSteps} from "@root/utils/tourSteps";

const ReferenceInformation: FC<ReferenceInformationProps> = ({
	method,
	body,
	connection,
	onReferenceClick,
	isToggledIcon,
	toggleIcon,
	location,
	style,
}) => {
	const ContainerRef = useRef();
	const [fieldBindings, setFieldBindings] = useState<CFieldBinding[]>([]);
	const extractReferences = () => {
		const allBindings = connection.getFieldBindingsByMethod(method);
		const filteredBindings = allBindings.filter(binding => {
			if (!binding.to.length) return false;
			const toField = binding.to[0].field;
			return toField.startsWith(location);
		});
		setFieldBindings(filteredBindings);
	};
	useEffect(() => {
		extractReferences();
	}, [body, method, location]);
	useEffect(() => {
		if (fieldBindings.length === 0 && isToggledIcon === true) {
			toggleIcon(!isToggledIcon);
		}
	}, [fieldBindings]);
	const hasFieldBindings = fieldBindings.length > 0;
	return (
		<ReferenceInformationStyled style={style} ref={ContainerRef}>
			<div>
				<b>{`Reference information`}</b>
				<span>{hasFieldBindings ? '' : ' (is empty now)'}</span>
				{hasFieldBindings && (
					<TooltipFontIcon
						tooltipPosition={'right'}
						style={{verticalAlign: 'middle', cursor: 'pointer', marginLeft: '15px'}}
						onClick={() => toggleIcon(!isToggledIcon)}
						tooltip={isToggledIcon ? 'Hide' : 'Show'}
						value={isToggledIcon ? 'expand_less' : 'chevron_right'}
					/>
				)}

				<div style={{position: 'absolute', left: '170px', top: 0}}>
					<HelpIcon steps={ReferenceInfoSteps} inputRef={ContainerRef}/>
				</div>
			</div>
			{isToggledIcon && hasFieldBindings && (
				<FieldBindingsBlockStyled>
					{fieldBindings.map((fieldBinding, key) => {
						if (fieldBinding.to.length === 0) {
							return null;
						}
						return (
							<FieldBindingBlockStyled
								key={key}
								onClick={() => onReferenceClick(fieldBinding.to[0].field)}
							>
								<span>
									<TargetFieldStyled>
										{fieldBinding.to[0].field}
									</TargetFieldStyled>
									<span>{` has ${
										fieldBinding.from.length > 1
											? 'next references: '
											: 'one reference: '
									}`}</span>
								</span>
								<div>
									{fieldBinding.from.map((item, key) => {
										const method = connection.getMethodByColor(item.color);
										return (
											<ReferenceBlockStyled key={key}>
												<SourceMethodNameStyled
													style={{ background: method.color }}
												>
													{method.label || method.name}
												</SourceMethodNameStyled>
												<span>{' bound with '}</span>
												<SourceFieldStyled>{item.field}</SourceFieldStyled>
												<span>{` field${
													key !== fieldBinding.from.length - 1 ? ';' : '.'
												}`}</span>
											</ReferenceBlockStyled>
										);
									})}
								</div>
							</FieldBindingBlockStyled>
						);
					})}
				</FieldBindingsBlockStyled>
			)}
		</ReferenceInformationStyled>
	);
};

export default ReferenceInformation;
