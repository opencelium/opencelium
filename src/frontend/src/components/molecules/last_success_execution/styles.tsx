import styled from "styled-components";
import {ScheduleDataAppearance} from "../../../styles/animations";
import {LastSuccessExecutionStyledProps} from "./interfaces";

const LastSuccessExecutionStyled = styled.div<LastSuccessExecutionStyledProps>`
    ${({isRefreshing}) => isRefreshing ? ScheduleDataAppearance : ''}
`;

export {
    LastSuccessExecutionStyled,
}