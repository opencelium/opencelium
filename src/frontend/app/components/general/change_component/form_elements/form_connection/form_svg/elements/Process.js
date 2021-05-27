/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {isString} from "@utils/app";
import {CONNECTOR_FROM} from "@classes/components/content/connection/CConnectorItem";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";

class Process extends React.Component{
    constructor(props) {
        super(props)
    }

    onMouseDown(){
        this.props.setCurrentItem(this.props.process);
    }

    deleteProcess(e){
        const {connection, process, updateConnection, setCurrentItem} = this.props;
        const method = process.entity;
        const connector = connection.getConnectorByMethodIndex(method);
        if(connector){
            if(connector.getConnectorType() === CONNECTOR_FROM){
                connection.removeFromConnectorMethod(method);
            } else{
                connection.removeToConnectorMethod(method);
            }
            updateConnection();
            const currentItem = connector.getCurrentItem();
            if(currentItem){
                const currentSvgElement = connector.getSvgElementByIndex(currentItem.index);
                setCurrentItem(currentSvgElement);
            }
        }
        e.stopPropagation();
    }

    render(){
        const {process, isNotDraggable, isCurrent, isHighlighted} = this.props;
        const method = process.entity;
        const borderRadius = 10;
        const labelX = '50%';
        const labelY = '50%';
        const closeX = process.width - 15;
        const closeY = 15;
        let label = method.label ? method.label : method.name ? method.name : '';
        let shortLabel = label;
        if(isString(label) && label.length > 12){
            shortLabel = `${label.substr(0, 9)}...`;
        }
        return(
            <svg x={process.x} y={process.y} className={`${styles.process} ${isCurrent ? styles.current_process : ''} ${isHighlighted ? styles.highlighted_process : ''} confine`} width={process.width} height={process.height}>
                <rect onMouseDown={::this.onMouseDown}  x={1} y={1} rx={borderRadius} ry={borderRadius} width={process.width - 2} height={process.height - 2} className={`${styles.process_rect} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={labelX} y={labelY}>
                    {shortLabel}
                </text>
                <title>{label}</title>
                {isCurrent &&
                    <DeleteIcon svgX={105} svgY={2} x={closeX} y={closeY} onClick={::this.deleteProcess}/>
                }
            </svg>
        );
    }
}

Process.propTypes = {
    process: PropTypes.oneOfType([
        PropTypes.instanceOf(CBusinessProcess),
        PropTypes.instanceOf(CTechnicalProcess),
    ]),
    isNotDraggable: PropTypes.bool,
    setCurrentBusinessItem: PropTypes.func,
    isCurrent: PropTypes.bool,
    isHighlighted: PropTypes.bool,
};

Process.defaultProps = {
    isNotDraggable: true,
    isCurrent: false,
    isHighlighted: false,
};

export default Process;