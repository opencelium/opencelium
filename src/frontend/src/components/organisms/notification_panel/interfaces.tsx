import {ITheme} from "../../general/Theme";
import {INotification} from "@interface/application/INotification";

interface NotificationPanelProps{
    theme?: ITheme,
}

interface NotificationProps{
    theme?: ITheme,
    notification: INotification,
}

export {
    NotificationPanelProps,
    NotificationProps,
}