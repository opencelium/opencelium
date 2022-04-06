/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {permission} from "../../../decorators/permission";
import {ButtonProps} from "@atom/button/interfaces";
import Button from "@atom/button/Button";
import {TooltipButton} from "@molecule/tooltip_button/TooltipButton";
import {TooltipButtonProps} from "@molecule/tooltip_button/interfaces";
import {TooltipProps} from "reactstrap";

export const PermissionButton = permission<ButtonProps>(null, false)(Button);
export const PermissionTooltipButton = permission<TooltipButtonProps & ButtonProps & Partial<TooltipProps>>(null, false)(TooltipButton);