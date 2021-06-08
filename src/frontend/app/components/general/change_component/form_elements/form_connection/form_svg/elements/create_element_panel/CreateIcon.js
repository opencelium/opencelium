import styles from "@themes/default/content/connections/connection_overview_2";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import React from "react";

export const CreateIcon = (props) => {
    const {style, create} = props;
    return(
        <TooltipFontIcon
            onClick={create}
            wrapStyles={style}
            wrapClassName={styles.add_icon}
            tooltip={'Create'}
            value={'add_circle_do_outline'}
            isButton={true}
        />
    )
}