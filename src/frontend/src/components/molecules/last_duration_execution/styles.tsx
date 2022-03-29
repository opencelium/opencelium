import styled from "styled-components";
import {ScheduleDataAppearance} from "../../../styles/animations";
import {LastDurationExecutionStyledProps} from "./interfaces";

const LastDurationExecutionStyled = styled.span<LastDurationExecutionStyledProps>`
    ${({isRefreshing}) => isRefreshing ? ScheduleDataAppearance : ''}
`;

export {
    LastDurationExecutionStyled,
}