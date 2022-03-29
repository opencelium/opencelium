import {API_REQUEST_STATE} from "@interface/application/IApplication";

export interface LoginIconStyledProps{
    isAuth?: boolean,
    hasRotation?: boolean,
}

export interface LoginIconProps{
    login: () => void;
    logining?: API_REQUEST_STATE,
}