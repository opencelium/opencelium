import {JwtPayload} from "jsonwebtoken";

import {IForm} from "@interface/application/core";

export interface ICredentials{
    email: string,
    password: string,
}

export interface TokenProps extends JwtPayload{
    role: string,
    sessionTime: string,
    userId: number,
}


export interface IAuthText{
    email: string;
    password: string;
}


export interface IAuthForm extends IAuthText, IForm<IAuthText, {}, {}, {}, {}, {}>{
    login: () => boolean;
}

export interface IAuth extends IAuthForm{
}
