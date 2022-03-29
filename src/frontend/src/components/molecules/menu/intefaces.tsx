import {LinkProps} from "react-router-dom";
import {PermissionProps} from "@constants/permissions";

interface SubLinkProps extends LinkProps{
    permission?: PermissionProps,
}

interface MenuLinkWithSubLinksProps{
    label?: string,
    subLinks: SubLinkProps[],
    isMainMenuExpanded?: boolean,
}

export {
    SubLinkProps,
    MenuLinkWithSubLinksProps,
}