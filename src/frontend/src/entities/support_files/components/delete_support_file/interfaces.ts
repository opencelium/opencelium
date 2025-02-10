import {ITheme} from "@style/Theme";
import {SupportFileResponse} from "@root/requests/interfaces/ISupportFile";

interface DeleteSupportFileProps{
    theme?: ITheme,
    supportFileResponse: SupportFileResponse,
}

export {
    DeleteSupportFileProps,
}
