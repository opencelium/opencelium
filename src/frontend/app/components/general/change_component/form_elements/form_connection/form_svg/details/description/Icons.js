import styles from "@themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import React from "react";

export const EditIcon = (props) => {
    return <TooltipFontIcon className={styles.edit_icon} tooltipPosition={'left'} size={16} isButton={true} tooltip={'Edit'} value={'edit'} onClick={props.onClick}/>;
}

export const ApplyIcon = (props) => {
    return <TooltipFontIcon className={styles.apply_icon} tooltipPosition={'left'} size={16} isButton={true} tooltip={'Apply'} value={'check'} onClick={props.onClick}/>;
}

export const CancelIcon = (props) => {
    return <TooltipFontIcon className={styles.cancel_icon} tooltipPosition={'left'} size={16} isButton={true} tooltip={'Cancel'} value={'close'} onClick={props.onClick}/>;
}