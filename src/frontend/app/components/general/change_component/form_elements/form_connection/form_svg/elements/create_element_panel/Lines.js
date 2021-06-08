import styles from "@themes/default/content/connections/connection_overview_2";
import React from "react";

export const Line = (props) => {
    const {style} = props;
    return(
        <div
            className={styles.create_element_panel_line}
            style={style}
        />
    );
}
