import {ITheme} from "../../general/Theme";
import {API_REQUEST_STATE} from "@interface/application/IApplication";

interface ImageProps extends Partial<HTMLImageElement>{
    theme?: ITheme,
    uploadImage?: any,
    uploadingImage?: API_REQUEST_STATE,
    hasUpload?: boolean,
    className?: string,
}

interface ImageStyledProps{
    isRefreshing?: boolean,
}

export {
    ImageProps,
    ImageStyledProps,
}