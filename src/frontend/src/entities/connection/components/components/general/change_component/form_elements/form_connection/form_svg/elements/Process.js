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

import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2.scss";
import {CBusinessProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@entity/connection/components/classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {isString} from "@application/utils/utils";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";
import {setCurrentBusinessItem} from "@entity/connection/redux_toolkit/slices/ConnectionSlice";
import {AssignIcon} from "@change_component/form_elements/form_connection/form_svg/details/description/Icons";
import {SvgItem} from "@entity/connection/components/decorators/SvgItem";
import CProcess from "@entity/connection/components/classes/components/content/connection_overview_2/process/CProcess";
import {BUSINESS_LABEL_MODE, COLOR_MODE} from "@entity/connection/components/classes/components/content/connection_overview_2/CSvg";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";
import CBusinessLayout from "@entity/connection/components/classes/components/content/connection_overview_2/CBusinessLayout";

function mapStateToProps(state){
    const connectionOverview = state.connectionReducer;
    const {currentBusinessItem} = mapItemsToClasses(state);
    return{
        colorMode: connectionOverview.colorMode,
        businessLabelMode: connectionOverview.businessLabelMode,
        isVisibleBusinessLabelKeyPressed: connectionOverview.isVisibleBusinessLabelKeyPressed,
        currentBusinessItem,
    }
}

@connect(mapStateToProps, {setCurrentBusinessItem})
@SvgItem(CProcess)
class Process extends React.Component{
    constructor(props) {
        super(props)

        this.state = {
            technicalRectClassName: '',
        }
    }

    onMouseOver(){
        const {connection, process} = this.props;
        if(connection && connection.businessLayout.isInAssignMode && process instanceof CTechnicalProcess) {
            this.setState({
                technicalRectClassName: styles.process_assign,
            });
        }
    }

    onMouseDown(){
        const {connection, setCurrentItem, process, isDisabled} = this.props;
        if(!isDisabled) {
            if (connection && !connection.businessLayout.isInAssignMode) {
                process.isDragged = true;
                setCurrentItem(process);
            }
        }

    }

    onMouseLeave(){
        const {connection, process} = this.props;
        if(connection && connection.businessLayout.isInAssignMode && process instanceof CTechnicalProcess) {
            this.setState({
                technicalRectClassName: '',
            });
        }
    }

    onDoubleClick(){
        const {isDisabled, connection} = this.props;
        if(!isDisabled && connection && !connection.businessLayout.isInAssignMode) {
            this.props.setIsCreateElementPanelOpened(true);
        }
    }

    onClick(){
        const {connection, setCurrentItem, process, assign, isDisabled, toggleReassignConfirmation} = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        if(!isDisabled) {
            if (isAssignMode) {
                assign();
            } else {
                process.isDragged = false;
                setCurrentItem(process);
            }
        } else{
            const isBusinessProcess = process instanceof CBusinessProcess;
            if (isAssignMode && !isBusinessProcess) {
                toggleReassignConfirmation();
            }
        }
    }

    deleteProcess(e){
        const {deleteProcess, process} = this.props;
        deleteProcess(process);
        e.stopPropagation();
    }

    setAssignMode(){
        const {connection, updateConnection} = this.props;
        if(connection){
            connection.businessLayout.isInAssignMode = true;
            updateConnection(connection);
        }
    }

    render(){
        const {technicalRectClassName} = this.state;
        const {
            process, isNotDraggable, isCurrent, isHighlighted, isAssignedToBusinessProcess,
            isDisabled, colorMode, readOnly, businessLabelMode, connection,
            isVisibleBusinessLabelKeyPressed, currentBusinessItem,
        } = this.props;
        const isAssignMode = connection && connection.businessLayout.isInAssignMode;
        const method = process.entity;
        const borderRadius = 10;
        const labelX = '50%';
        const labelY = '50%';
        const closeX = process.width - 15;
        const closeY = 15;
        const assignX = process.width - 45;
        const assignY = 15;
        const methodName = method ? method.label ? method.label : method.name ? method.name : '' : '';
        let label = methodName === '' ? isString(process.name) ? process.name : '' : methodName;
        if(!isAssignMode && process instanceof CTechnicalProcess){
            let businessItem = null;
            switch (businessLabelMode){
                case BUSINESS_LABEL_MODE.NOT_VISIBLE:
                    break;
                case BUSINESS_LABEL_MODE.VISIBLE:
                case BUSINESS_LABEL_MODE.VISIBLE_ON_PRESS_KEY:
                    if(businessLabelMode === BUSINESS_LABEL_MODE.VISIBLE_ON_PRESS_KEY){
                        if(!isVisibleBusinessLabelKeyPressed){
                            break;
                        }
                    }
                    businessItem = connection ? connection.businessLayout.getItemByTechnicalItem(process) : null;
                    if(businessItem){
                        label = businessItem.name;
                    } else{
                        label = '';
                    }
                    break;
            }
        }
        const color = method ? method.color : '';
        let hasColor = color !== '';
        let shortLabel = label;
        if(isString(label) && label.length > 12){
            shortLabel = `${label.substr(0, 9)}...`;
        }
        const assignedStyle = isAssignMode && isAssignedToBusinessProcess ? styles.assigned_process : '';
        const hasAssignIcon = isCurrent && !readOnly && process instanceof CBusinessProcess;
        const isDisabledStyle = isDisabled ? styles.disabled_process : '';
        const hasDraggableProcess = isCurrent && currentBusinessItem && currentBusinessItem.isDragged && CBusinessLayout.isInstanceOfBusinessItem(process);
        return(
            <React.Fragment>
                <svg id={process.getHtmlIdName()} x={process.x} y={process.y} className={`${isDisabledStyle} ${isHighlighted && !isCurrent ? styles.highlighted_process : ''} confine`} width={process.width} height={process.height}>
                    <rect fill={colorMode !== COLOR_MODE.BACKGROUND || !hasColor ? '#fff' : color} onDoubleClick={(a) => this.onDoubleClick(a)} onClick={(a) => this.onClick(a)} onMouseOver={(a) => this.onMouseOver(a)} onMouseDown={(a) => this.onMouseDown(a)} onMouseLeave={(a) => this.onMouseLeave(a)} x={1} y={1} rx={borderRadius} ry={borderRadius} width={process.width - 2} height={process.height - 2}
                          className={`${technicalRectClassName} ${styles.process_rect} ${assignedStyle} ${isCurrent ? styles.current_process : ''} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}
                    />
                    <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={labelX} y={labelY}>
                        {shortLabel}
                    </text>
                    <title>{label}</title>
                    {hasColor && colorMode === COLOR_MODE.RECTANGLE_TOP && <rect className={styles.process_color_rect} fill={color} x={10} y={5} width={isCurrent && !readOnly ? 95 : 110} height={15} rx={5} ry={5}/>}
                    {hasColor && colorMode === COLOR_MODE.CIRCLE_LEFT_TOP && <circle className={styles.process_color_circle} cx={15} cy={15} r="10" fill={color}/>}
                    {isCurrent && !readOnly &&
                        <DeleteIcon svgX={105} svgY={2} x={closeX} y={closeY} onClick={(a) => this.deleteProcess(a)}/>
                    }
                    {hasAssignIcon &&
                        <AssignIcon svgX={85} svgY={2} x={assignX} y={assignY} onClick={(a) => this.setAssignMode(a)}/>
                    }
                </svg>
                {hasDraggableProcess &&
                    <rect id={'draggable_process'} className={styles.draggable_process} rx={borderRadius} ry={borderRadius} x={process.x} y={process.y} width={process.width} height={process.height}/>
                }
            </React.Fragment>
        );
    }
}

Process.propTypes = {
    process: PropTypes.oneOfType([
        PropTypes.instanceOf(CBusinessProcess),
        PropTypes.instanceOf(CTechnicalProcess),
    ]),
    deleteProcess: PropTypes.func.isRequired,
    isNotDraggable: PropTypes.bool,
    setCurrentBusinessItem: PropTypes.func,
    isCurrent: PropTypes.bool,
    isHighlighted: PropTypes.bool,
    isAssignedToBusinessProcess: PropTypes.bool,
    isDisabled: PropTypes.bool,
};

Process.defaultProps = {
    isNotDraggable: true,
    isCurrent: false,
    isHighlighted: false,
    isAssignedToBusinessProcess: false,
    isDisabled: false,
};

export default Process;