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
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import styles from "@themes/default/content/connections/connection_overview_2.scss";
import {CBusinessProcess} from "@classes/components/content/connection_overview_2/process/CBusinessProcess";
import {CTechnicalProcess} from "@classes/components/content/connection_overview_2/process/CTechnicalProcess";
import {isString} from "@utils/app";
import DeleteIcon from "@change_component/form_elements/form_connection/form_svg/elements/DeleteIcon";
import {setCurrentBusinessItem, setIsAssignMode} from "@actions/connection_overview_2/set";
import {AssignIcon} from "@change_component/form_elements/form_connection/form_svg/details/description/Icons";
import {SvgItem} from "@decorators/SvgItem";
import CProcess from "@classes/components/content/connection_overview_2/process/CProcess";
import {BUSINESS_LABEL_MODE, COLOR_MODE} from "@classes/components/content/connection_overview_2/CSvg";
import {mapItemsToClasses} from "@change_component/form_elements/form_connection/form_svg/utils";

function mapStateToProps(state){
    const connectionOverview = state.get('connection_overview');
    const {currentBusinessItem} = mapItemsToClasses(state);
    return{
        colorMode: connectionOverview.get('colorMode'),
        isAssignMode: connectionOverview.get('isAssignMode'),
        businessLabelMode: connectionOverview.get('businessLabelMode'),
        isVisibleBusinessLabelKeyPressed: connectionOverview.get('isVisibleBusinessLabelKeyPressed'),
        currentBusinessItem,
    }
}

@connect(mapStateToProps, {setCurrentBusinessItem, setIsAssignMode})
@SvgItem(CProcess)
class Process extends React.Component{
    constructor(props) {
        super(props)

        this.state = {
            technicalRectClassName: '',
        }
    }

    onMouseOver(){
        const {isAssignMode, process} = this.props;
        if(isAssignMode && process instanceof CTechnicalProcess) {
            this.setState({
                technicalRectClassName: styles.process_assign,
            });
        }
    }

    onMouseLeave(){
        const {isAssignMode, process} = this.props;
        if(isAssignMode && process instanceof CTechnicalProcess) {
            this.setState({
                technicalRectClassName: '',
            });
        }
    }

    onDoubleClick(){
        const {isDisabled, isAssignMode} = this.props;
        if(!isDisabled && !isAssignMode) {
            this.props.setIsCreateElementPanelOpened(true);
        }
    }

    onClick(){
        const {isAssignMode, setCurrentItem, process, assign, isDisabled, toggleReassignConfirmation} = this.props;
        if(!isDisabled) {
            if (isAssignMode) {
                assign();
            } else {
                setCurrentItem(process);
            }
        } else{
            if (isAssignMode) {
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
        const {setIsAssignMode} = this.props;
        setIsAssignMode(true);
    }

    render(){
        const {technicalRectClassName} = this.state;
        const {
            process, isNotDraggable, isCurrent, isHighlighted, isAssignedToBusinessProcess,
            isDisabled, colorMode, readOnly, isAssignMode, businessLabelMode, connection,
            isVisibleBusinessLabelKeyPressed,
        } = this.props;
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
        return(
            <svg x={process.x} y={process.y} className={`${isDisabledStyle} ${isHighlighted && !isCurrent ? styles.highlighted_process : ''} confine`} width={process.width} height={process.height}>
                <rect fill={colorMode !== COLOR_MODE.BACKGROUND || !hasColor ? '#fff' : color} onDoubleClick={::this.onDoubleClick} onClick={::this.onClick} onMouseOver={::this.onMouseOver} onMouseLeave={::this.onMouseLeave} x={1} y={1} rx={borderRadius} ry={borderRadius} width={process.width - 2} height={process.height - 2}
                      className={`${technicalRectClassName} ${styles.process_rect} ${assignedStyle} ${isCurrent ? styles.current_process : ''} ${isNotDraggable ? styles.not_draggable : styles.process_rect_draggable} draggable`}
                />
                <text dominantBaseline={"middle"} textAnchor={"middle"} className={styles.process_label} x={labelX} y={labelY}>
                    {shortLabel}
                </text>
                {hasColor && colorMode === COLOR_MODE.RECTANGLE_TOP && <rect className={styles.process_color_rect} fill={color} x={10} y={5} width={isCurrent && !readOnly ? 95 : 110} height={15} rx={5} ry={5}/>}
                {hasColor && colorMode === COLOR_MODE.CIRCLE_LEFT_TOP && <circle className={styles.process_color_circle} cx={15} cy={15} r="10" fill={color}/>}
                {isCurrent && !readOnly &&
                    <DeleteIcon svgX={105} svgY={2} x={closeX} y={closeY} onClick={::this.deleteProcess}/>
                }
                {hasAssignIcon &&
                    <AssignIcon svgX={85} svgY={2} x={assignX} y={assignY} onClick={::this.setAssignMode}/>
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