import styled from "styled-components";
import {ScheduleDataAppearance} from "../../../styles/animations";
import {LastFailExecutionStyledProps} from "@molecule/last_fail_execution/interfaces";

const LastFailExecutionStyled = styled.div<LastFailExecutionStyledProps>`
    ${({isRefreshing}) => isRefreshing ? ScheduleDataAppearance : ''}
`;

export {
    LastFailExecutionStyled,
}