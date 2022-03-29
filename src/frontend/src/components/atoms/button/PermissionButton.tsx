import {permission} from "../../../decorators/permission";
import {ButtonProps} from "@atom/button/interfaces";
import Button from "@atom/button/Button";

export const PermissionButton = permission<ButtonProps>(null, false)(Button);