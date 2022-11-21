/*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import React from "react";

export const EditIcon = (props) => {
    return <TooltipFontIcon className={styles.edit_icon} tooltipPosition={'left'} size={14} isButton={true} tooltip={'Edit'} value={'edit'} onClick={props.onClick}/>;
}

export const ApplyIcon = (props) => {
    return <TooltipFontIcon className={styles.apply_icon} tooltipPosition={'left'} size={14} isButton={true} tooltip={'Apply'} value={'check'} onClick={props.onClick}/>;
}

export const CancelIcon = (props) => {
    return <TooltipFontIcon className={styles.cancel_icon} tooltipPosition={'left'} size={14} isButton={true} tooltip={'Cancel'} value={'close'} onClick={props.onClick}/>;
}

export const ViewIcon = (props) => {
    return <TooltipFontIcon className={styles.edit_icon} tooltipPosition={'left'} size={14} isButton={true} tooltip={'More'} value={'more_vert'} onClick={props.onClick}/>;
}