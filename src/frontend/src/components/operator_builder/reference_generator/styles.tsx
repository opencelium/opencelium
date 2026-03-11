import Button from "@app_component/base/button/Button";
import {
	ReferenceGeneratorStyleProps,
	RadioSwitcherStyleProps
} from "@app_component/operator_builder/reference_generator/props";
import styled from 'styled-components';

export const LikePercentageContainer = styled.div<{hasSign: boolean,}>`
	&>div{
		opacity: ${({hasSign}) => hasSign ? 1 : 0.5};
		font-weight: ${({hasSign}) => hasSign ? 'bold' : 'normal'};
		display: flex;
		justify-content: center;
		height: 100%;
		align-items: center;
	}
	&>div:hover{
		cursor: pointer;
	}
	&>div:active{
		font-weight: 500;
	}
`;
export const ReferenceGeneratorContainer = styled.div<ReferenceGeneratorStyleProps>`
	display: grid;
	justify-content: center;
	align-items: center;
	min-width: 420px;
	${({ referenceType }) =>
		referenceType === 'constant' &&
		`
        grid-template-columns: 30px 390px;
    `}
	${({ referenceType, isLikeOperator }) =>
		referenceType === 'constant' && isLikeOperator &&
		`
        grid-template-columns: 30px 10px 350px 10px;
    `}
	${({ referenceType, isAbsolute, manualAdd }) =>
		referenceType === 'constant' && (isAbsolute || manualAdd) &&
		`
        grid-template-columns: 30px 380px 30px;
    `}
	${({ referenceType, apiResponseType }) =>
		referenceType === 'direct' &&
		`
        grid-template-columns: 30px 180px 30px 170px;
    `}
	${({ referenceType, isLikeOperator, apiResponseType }) =>
		referenceType === 'direct' && isLikeOperator && 
		`
        grid-template-columns: 30px 10px 180px 30px 150px 10px;
    `}
	${({ referenceType, isAbsolute, manualAdd, apiResponseType }) =>
		referenceType === 'direct' && (isAbsolute || manualAdd) &&
		`
        grid-template-columns: 30px 180px 30px 170px 30px;
    `}
	${({ referenceType, isAbsolute, endpointReference, apiResponseType }) =>
		referenceType === 'direct' && isAbsolute && endpointReference &&
		`
        grid-template-columns: 180px 30px 170px 30px;
    `}
	${({ referenceType }) =>
		referenceType === 'webhook' &&
		`
        grid-template-columns: 30px 390px;
    `}
	${({ referenceType, isLikeOperator }) =>
		referenceType === 'webhook' && isLikeOperator &&
		`
        grid-template-columns: 30px 10px 350px 10px;
    `}
    ${({ referenceType, isAbsolute, manualAdd }) =>
		referenceType === 'webhook' && (isAbsolute || manualAdd) &&
		`
        grid-template-columns: 30px 380px 30px;
    `}
    gap: 10px;
		${({ isAbsolute, endpointReference}) =>
			isAbsolute &&
			`
				background: #fff;
				position: absolute;
				z-index: 10000;
				padding: 5px;
				${!endpointReference ? 'box-shadow: rgba(0, 0, 0, 0.14) 0 0 0 0, #9f9f9f 0 1px 7px 1px, rgba(0, 0, 0, 0.22) 0 1px 1px 0;' : ''}
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

export const RadioSwitchersContainer = styled.div<RadioSwitcherStyleProps>`
    float: left;
    display: ${({isHidden}) => isHidden ? 'none' : 'grid'};/*
    height: 47px;
    margin-top: -10px;
    padding-bottom: 9px;*/
    overflow: hidden;
    transition: width 0.3s ease 0s;
`;

export const RadioSwitcherContainer = styled.div`
	height: 14px;
	display: flex;
	justify-content: center;
	align-items: center;
`;

export const UpdateParamButton = styled(Button)`
`

export const AddParamButton = styled(Button)`
`
