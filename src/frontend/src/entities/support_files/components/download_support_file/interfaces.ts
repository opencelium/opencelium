import {ITheme} from "@style/Theme";
import {SupportFileResponse} from "@root/requests/interfaces/ISupportFile";

interface DownloadSupportFileProps{
    theme?: ITheme,
    supportFileResponse: SupportFileResponse,
}

export {
    DownloadSupportFileProps,
}
