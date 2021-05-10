import React from 'react';

import styles from "@themes/default/content/connections/connection_overview_2.scss";

export const DefaultMarkers = () => {
    return (
        <React.Fragment>
            <marker id="arrow_head_right" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
            <marker id="arrow_head_down" markerWidth="7" markerHeight="10"
                    refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 7 0, 3.5 10" />
            </marker>
            <marker id="arrow_head_left" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto">
                <polygon points="10 0, 0 3.5, 10 7" />
            </marker>
            <marker id="arrow_head_up" markerWidth="7" markerHeight="10"
                    refX="0" refY="3.5" orient="auto">
                <polygon points="0 10, 3.5 0, 7 10" />
            </marker>
        </React.Fragment>
    );
};

export const HighlightedMarkers = () => {
    return (
        <React.Fragment>
            <marker id="arrow_head_right_highlighted" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto" className={styles.highlighted_marker}>
                <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
            <marker id="arrow_head_down_highlighted" markerWidth="7" markerHeight="10"
                    refX="0" refY="3.5" orient="auto" className={styles.highlighted_marker}>
                <polygon points="0 0, 7 0, 3.5 10" />
            </marker>
            <marker id="arrow_head_left_highlighted" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto" className={styles.highlighted_marker}>
                <polygon points="10 0, 0 3.5, 10 7" />
            </marker>
            <marker id="arrow_head_up_highlighted" markerWidth="7" markerHeight="10"
                    refX="0" refY="3.5" orient="auto" className={styles.highlighted_marker}>
                <polygon points="0 10, 3.5 0, 7 10" />
            </marker>
        </React.Fragment>
    );
}