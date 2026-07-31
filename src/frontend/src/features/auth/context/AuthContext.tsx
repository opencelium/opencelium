import {createContext} from "react";
import {AuthService} from "@features/auth/AuthService.ts";

const AuthContext = createContext<AuthService | null>(null)

export default AuthContext;
