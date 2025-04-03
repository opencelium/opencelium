import Button from "@app_component/base/button/Button";
import {
	ReferenceGeneratorStyleProps,
	ReferenceSwitcherStyleProps
} from "@app_component/operator_builder/reference_generator/props";
import styled from 'styled-components';

export const ReferenceGeneratorContainer = styled.div<ReferenceGeneratorStyleProps>`
	display: grid;
	justify-content: center;
	align-items: center;
	min-width: 420px;
	${({ referenceType }) =>
		referenceType === 'constant' &&
		`
        grid-template-columns: 30px 380px;
    `}
	${({ referenceType, isAbsolute }) =>
		referenceType === 'constant' && isAbsolute &&
		`
        grid-template-columns: 30px 380px 30px;
    `}
	${({ referenceType }) =>
		referenceType === 'direct' &&
		`
        grid-template-columns: 30px 180px 200px;
    `}
	${({ referenceType, isAbsolute }) =>
		referenceType === 'direct' && isAbsolute &&
		`
        grid-template-columns: 30px 180px 200px 30px;
    `}
    ${({ referenceType }) =>
		referenceType === 'webhook' &&
		`
        grid-template-columns: 30px 380px;
    `}
    ${({ referenceType, isAbsolute }) =>
		referenceType === 'webhook' && isAbsolute &&
		`
        grid-template-columns: 30px 380px 30px;
    `}
    gap: 10px;
		${({ isAbsolute }) =>
			isAbsolute &&
			`
				background: #fff;
				position: absolute;
				z-index: 10000;
				padding: 5px;
				box-shadow: rgba(0, 0, 0, 0.14) 0 0 0 0, #9f9f9f 0 1px 7px 1px,
					rgba(0, 0, 0, 0.22) 0 1px 1px 0;
			`
		}
		${({ isAbsolute, parent }) =>
			isAbsolute && !parent &&
			`
				right: 0;
				bottom: -45px;
			`
		}
		
`;

export const ConstantContainer = styled.div`
`;

export const ReferenceSwitcherContainer = styled.div<ReferenceSwitcherStyleProps>`
    float: left;
    display: ${({isHidden}) => isHidden ? 'none' : 'grid'};
    height: 47px;
    margin-top: -10px;
    padding-bottom: 9px;
    overflow: hidden;
    transition: width 0.3s ease 0s;
`;

export const UpdateParamButton = styled(Button)`
`

export const AddParamButton = styled(Button)`
`