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

import React from 'react';

import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";

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

export const PlaceholderMarkers = () => {
    return (
        <React.Fragment>
            <marker id="arrow_head_right_placeholder" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto" className={styles.placeholder_marker}>
                <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
            <marker id="arrow_head_down_placeholder" markerWidth="7" markerHeight="10"
                    refX="0" refY="3.5" orient="auto" className={styles.placeholder_marker}>
                <polygon points="0 0, 7 0, 3.5 10" />
            </marker>
            <marker id="arrow_head_left_placeholder" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto" className={styles.placeholder_marker}>
                <polygon points="10 0, 0 3.5, 10 7" />
            </marker>
            <marker id="arrow_head_up_placeholder" markerWidth="7" markerHeight="10"
                    refX="0" refY="3.5" orient="auto" className={styles.placeholder_marker}>
                <polygon points="0 10, 3.5 0, 7 10" />
            </marker>
        </React.Fragment>
    );
}

export const RejectedPlaceholderMarkers = () => {
    return (
        <React.Fragment>
            <marker id="arrow_head_right_rejected_placeholder" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto" className={styles.rejected_placeholder_marker}>
                <polygon points="0 0, 10 3.5, 0 7" />
            </marker>
            <marker id="arrow_head_down_rejected_placeholder" markerWidth="7" markerHeight="10"
                    refX="0" refY="3.5" orient="auto" className={styles.rejected_placeholder_marker}>
                <polygon points="0 0, 7 0, 3.5 10" />
            </marker>
            <marker id="arrow_head_left_rejected_placeholder" markerWidth="10" markerHeight="7"
                    refX="0" refY="3.5" orient="auto" className={styles.rejected_placeholder_marker}>
                <polygon points="10 0, 0 3.5, 10 7" />
            </marker>
            <marker id="arrow_head_up_rejected_placeholder" markerWidth="7" markerHeight="10"
                    refX="0" refY="3.5" orient="auto" className={styles.rejected_placeholder_marker}>
                <polygon points="0 10, 3.5 0, 7 10" />
            </marker>
        </React.Fragment>
    );
}