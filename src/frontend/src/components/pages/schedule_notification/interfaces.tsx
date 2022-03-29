import {IForm} from "@interface/application/IForm";
import {ITheme} from "../../general/Theme";
import {Schedule} from "@class/schedule/Schedule";


interface ScheduleNotificationFormProps extends IForm{
    toggle: () => void,
    isToggled: boolean,
    schedule: Schedule,
    notificationId: number,
}

interface ScheduleNotificationListProps extends ScheduleNotificationListStyledProps{
    theme?: ITheme,
    schedule: Schedule,
    isVisible?: boolean,
    close: () => void,
}

interface ScheduleNotificationListStyledProps{
    x: number,
    y: number,
}

export {
    ScheduleNotificationFormProps,
    ScheduleNotificationListProps,
    ScheduleNotificationListStyledProps,
}