import styled from "styled-components";
import {ScheduleDataAppearance} from "../../../styles/animations";
import {ExecutionStatusStyledProps} from "./interfaces";

const ExecutionStatusStyled = styled.span<ExecutionStatusStyledProps>`
    ${({isRefreshing}) => isRefreshing ? ScheduleDataAppearance : ''}
`;

export {
    ExecutionStatusStyled,
}