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
import {connect} from 'react-redux';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {mapItemsToClasses} from "../utils";

function mapStateToProps(state){
    const {currentItem, currentSubItem} = mapItemsToClasses(state);
    return{
        currentItem,
        currentSubItem,
    };
}

@connect(mapStateToProps, {})
class Process extends React.Component{
    constructor(props) {
        super(props)
    }

    onMouseDown(){
        this.props.setCurrentItem(this.props.process);
    }

    deleteProcess(e){
        console.log('delete process');
        e.stopPropagation();
    }

    render(){
        const {currentItem, currentSubItem, process, isNotDraggable} = this.props;
        let isCurrentProcess = currentItem ? currentItem.id === process.id : false;
        if(!isCurrentProcess){
            isCurrentProcess = currentSubItem ? currentSubItem.id === process.id : false;
        }
        const borderRadius = 10;
        const labelX = '50%';
        const labelY = '50%';
        const closeX = process.width - 15;
        const closeY = 15;
        let label = process.label ? process.label : process.name;
        if(label.length > 12){
            label = `${label.substr(0, 9)}...`;
        }
        return(
            <svg x={process.x} y={process.y} className={`${styles.process} ${isCurrentProcess ? styles.current_process : ''} confine`} width={process.width} height={process.height}>
                <rect onMouseDown={::this.onMouseDown}  x={1} y={1} rx={borderRadius} ry={borderRadius} width={process.width - 2} height={process.height - 2} className={`${styles.process_rect} ${isNotDraggable ? '' : `${styles.process_rect_draggable} draggable`}`}/>
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={labelX} y={labelY}>
                    {label}
                </text>
                {isCurrentProcess &&
                    <text onMouseDown={::this.deleteProcess} dominantBaseline={"text-top"} textAnchor={"start"} className={styles.process_close} x={closeX}
                          y={closeY}>
                        {'x'}
                    </text>
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
    setCurrentItem: PropTypes.func,
};

Process.defaultProps = {
    isNotDraggable: false,
};

export default Process;