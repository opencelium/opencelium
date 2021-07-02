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

export const ViewIcon = (props) => {
    return <TooltipFontIcon className={styles.edit_icon} tooltipPosition={'left'} size={16} isButton={true} tooltip={'More'} value={'more_vert'} onClick={props.onClick}/>;
}

export const AssignIcon = (props) => {
    const {svgX, svgY, x, y, onClick} = props;
    return(
        <svg x={svgX} y={svgY} onClick={onClick}>
            <rect x="0" y="0" width="24" height="24" onClick={onClick} className={styles.process_assign_rect}/>
            <path id={'assign_icon'} className={styles.process_assign} x={x} y={y} onClick={onClick} xmlns="http://www.w3.org/2000/svg" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z">
                <title>{'Assign'}</title>
            </path>
        </svg>
    )
}