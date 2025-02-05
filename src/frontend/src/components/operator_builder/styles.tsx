import styled from 'styled-components';
import Button from "@app_component/base/button/Button";
import {GroupHeaderStyleProps, GroupStyleProps, RuleStyleProps} from "@app_component/operator_builder/props";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";

export const RuleContainer = styled.div<RuleStyleProps>`
    position: relative;
    display: flex;
    padding: 10px;
    background: #fff;
    border-radius: 5px;
    gap: 10px;
    &:before {
        border-width: 0 0 2px 2px;
        top: -1px;
        height: calc(50% + 1px + 1px);
        z-index: 0;
        content: "";
        position: absolute;
        border-color: #ccc;
        border-style: solid;
        box-sizing: border-box;
        left: -13px;
        width: 13px;
    }
    ${({hasNext}) => hasNext ? `
    &:after {
        content: "";
        position: absolute;
        border-color: #ccc;
        border-style: solid;
        box-sizing: border-box;
        border-width: 0 0 0 2px;
        top: calc(50% + 1px);
        height: calc(50% - 1px + 10px + 2px);
        left: -13px;
    }` : ''}
`;

export const GroupContainer = styled.div<GroupStyleProps>`
    position: relative;
    display: grid;
    gap: 10px;
    background: rgba(250, 240, 210, 0.5);
    border: 1px solid #DCC896;
    border-radius: 5px;
    padding-bottom: 10px;
    overflow-x: auto;
    ${({isInitial}) => !isInitial ? `
    &:before {
        border-width: 0 0 2px 2px;
        top: -1px;
        height: calc(50% + 1px + 1px);
        z-index: 0;
        content: "";
        position: absolute;
        border-color: #ccc;
        border-style: solid;
        box-sizing: border-box;
        left: -13.5px;
        width: 13px;
    }
    ` : ''}
    ${({hasNext}) => hasNext ? `
    &:after {
        content: "";
        position: absolute;
        border-color: #ccc;
        border-style: solid;
        box-sizing: border-box;
        border-width: 0 0 0 2px;
        top: calc(50%);
        height: calc(50% - 1px + 10px + 2px);
        left: -13.5px;
    }` : ''}
`;

export const GroupHeaderContainer = styled.div<GroupHeaderStyleProps>`
    display: flex;
    position: relative;
    justify-content: space-between;
    align-items: stretch;
    padding-left: 10px;
    padding-right: 10px;
    margin-top: 10px;
    margin-bottom: 10px;
    ${({hasItems}) => hasItems ? `
    &:after {
        content: "";
        position: absolute;
        border-color: #ccc;
        border-style: solid;
        box-sizing: border-box;
        border-width: 0 0 0 2px;
        top: calc(50% + 9px);
        height: calc(50% - 1px + 10px + 2px);
        left: 11px;
    }` : ''}
`;
export const ConjunctionContainer = styled.div`
    display: flex;
`;
export const ActionsContainer = styled.div`
    display: flex;
    gap: 20px;
`;
export const ActionButton = styled(Button)`

`;
export const DeleteButtonContainer = styled.div`
    flex: 1;
    display: flex;
    justify-content: right;
`;
export const DeleteButton = styled(TooltipButton)`
`;
export const ConjunctionAndButton = styled(Button)`
    z-index: 1;
    border-radius: 5px 0 0 5px;
`;
export const ConjunctionOrButton = styled(Button)`
    z-index: 1;
    border-radius: 0 5px 5px 0;
`;
export const SaveOperatorButton = styled(Button)`
    float: right;
    margin-top: 30px;
`;
export const GroupItemsContainer = styled.div`
    padding-left: 24px;
    padding-right: 10px;
    position: relative;
    display: grid;
    gap: 10px;
`;
