import styled from 'styled-components';
import {
    ReferenceGeneratorStyleProps,
    ReferenceSwitcherStyleProps
} from "@app_component/operator_builder/reference_generator/props";
import {
    TransitionEffect
} from "@change_component/form_elements/form_connection/form_svg/details/description/operator/Condition";
import Button from "@app_component/base/button/Button";

export const ReferenceGeneratorContainer = styled.div<ReferenceGeneratorStyleProps>`
    display: grid;
    justify-content: center;
    align-items: center;
    min-width: 420px;
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

export const ReferenceSwitcherContainer = styled.div<ReferenceSwitcherStyleProps>`
    float: left;
    display: ${({isHidden}) => isHidden ? 'none' : 'grid'};
    height: 39px;
    margin-top: -1px;
    padding-bottom: 9px;
    overflow: hidden;
    transition: ${TransitionEffect},
`;

export const UpdateParamButton = styled(Button)`
`

export const AddParamButton = styled(Button)`
`
