import {ITheme} from "@style/Theme";
import {SupportFileResponse} from "@root/requests/interfaces/ISupportFile";

interface DeleteSupportFilesProps{
    theme?: ITheme,
    isDisabled: boolean,
    supportFilesResponses: SupportFileResponse[],
}

export {
    DeleteSupportFilesProps,
}
