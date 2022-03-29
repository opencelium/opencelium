import styled from "styled-components";
import {ScheduleNotificationListStyledProps} from "@page/schedule_notification/interfaces";
import {Text} from "@atom/text/Text";
import {NotificationListAppearance} from "../../../styles/animations";

const ScheduleNotificationListStyled = styled.div<ScheduleNotificationListStyledProps>`
    ${NotificationListAppearance}
    width: 300px;
    height: auto;
    position: absolute;
    left: ${({x}) => x || 0}px;
    top: ${({y}) => y || 0}px;
    background: white;
    border: 1px solid #eee;
    border-radius: 2px;
`;

const ListStyled = styled.div`
    padding: 5px;
    overflow-x: hidden;
    overflow-y: auto;
    max-height: 198px;
`;

const BottomActionsStyled = styled.div`
    border-top: 1px solid #eee;
    margin: 0 3px;
`;

const EmptyListStyled = styled(Text)`
`;

export {
    ListStyled,
    ScheduleNotificationListStyled,
    BottomActionsStyled,
    EmptyListStyled,
}