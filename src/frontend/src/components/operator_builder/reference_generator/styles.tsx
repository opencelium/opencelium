import styled from 'styled-components';
import {
    ReferenceGeneratorStyleProps,
    ReferenceSwitcherStyleProps
} from "@app_component/operator_builder/reference_generator/props";
import Button from "@app_component/base/button/Button";

export const ReferenceGeneratorContainer = styled.div<ReferenceGeneratorStyleProps>`
    display: grid;
    justify-content: center;
    align-items: center;
    min-width: 420px;
    ${({referenceType}) => referenceType === 'constant' &&
            `
        grid-template-columns: 30px 380px;
    `}
    ${({referenceType}) => referenceType === 'direct' &&
    `
        grid-template-columns: 30px 180px 200px;
    `}
    ${({referenceType}) => referenceType === 'webhook' &&
    `
        grid-template-columns: 30px 380px;
    `}
    gap: 10px;
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
