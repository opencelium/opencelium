// --- Enums / basic types ---
import type {NormalizedUser} from "@features/auth/types.ts";

export type Permission = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';

export type Language = 'eng' | string; // extend if needed

// --- Core models ---
export interface ComponentPermission {
    componentId: number;
    name: string;
    permissions: Permission[];
}

export interface UserGroup {
    groupId: number;
    name: string;
    description: string | null;
    icon: string | null;
    components: ComponentPermission[];
}

export interface UserDetail {
    name: string;
    surname: string;
    userTitle: string | null;
    phoneNumber: string | null;
    department: string | null;
    organization: string | null;
    profilePicture: string | null;
    appTour: boolean;
    theme: string | null;
    themeSync: boolean;
    lang: Language;
    bitbucketUser: string | null;
    bitbucketPassword: string | null;
    requestTime: number;
}

export interface WidgetSetting {
    widgetSettingId: number;
    widgetId: number;
    i: string; // widget key (e.g. METRICS_OVERVIEW)
    x: number;
    y: number;
    w: number;
    h: number;
    minW: number;
    minH: number;
}

// --- Auth Session & Status ---
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthSession {
    accessToken: string
    user: AuthUser
    normalizedUser: NormalizedUser
}

// --- Two-factor (TOTP) login ---
/**
 * Challenge returned by /login when the account requires TOTP — no token is issued yet.
 * Two shapes come back, tagged on arrival:
 *  - 'setup'  — first activation: includes the QR + secret to enrol an authenticator.
 *  - 'verify' — already enrolled: only the session to validate the next code against.
 */
export type TotpChallenge =
    | { mode: 'setup'; sessionId: string; secretKey: string; qr: string }
    | { mode: 'verify'; sessionId: string }

/** A login attempt either authenticates outright or stalls on a TOTP challenge. */
export type LoginResult =
    | { status: 'authenticated'; session: AuthSession }
    | { status: 'totp-required'; challenge: TotpChallenge }

export type TotpValidateInput = {
    code: string
    sessionId: string
}

// --- Main Auth User ---
export interface AuthUser {
    userId: number;
    email: string;
    username: string | null;
    totpEnabled: boolean;

    userGroup: UserGroup;
    userDetail: UserDetail;

    widgetSettings: WidgetSetting[];
}
