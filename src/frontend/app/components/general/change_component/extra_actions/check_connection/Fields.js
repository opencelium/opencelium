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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/general/change_component";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {isString} from "@utils/app";
import JsonBody from "@change_component/form_elements/form_connection/form_methods/method/JsonBody";
import {CONNECTOR_FROM, CONNECTOR_TO} from "@classes/components/content/connection/CConnectorItem";
import CFields from "@classes/components/general/change_component/extra_actions/CFields";
import Counter from "@change_component/extra_actions/check_connection/Counter";


class Fields extends Component{
    constructor(props) {
        super(props);

        this.state = {
            isExpanded: false,
            currentIndex: 0,
        };
    }

    componentDidMount(){
        const {selectedField} = this.props;
        if(selectedField){
            this.setState({
                currentIndex: selectedField.currentIndex,
                isExpanded: true,
            });
        }
    }

    /**
     * to toggle all fields
     */
    toggleExpanded(){
        this.setState({
            isExpanded: !this.state.isExpanded,
            currentIndex: this.state.isExpanded ? 0 : this.state.currentIndex,
        });
    }

    /**
     * to show next fields
     */
    increaseCurrentIndex(){
        this.setState({currentIndex: this.state.currentIndex + 1});
    }

    /**
     * to show previous fields
     */
    decreaseCurrentIndex(){
        this.setState({currentIndex: this.state.currentIndex - 1});
    }

    /**
     * to show specific fields
     */
    setCurrentIndex(currentIndex){
        this.setState({currentIndex});
    }

    /**
     * to move to dependency in from connector
     */
    openDependency(data){
        this.props.selectFieldByDependency(data);
    }

    /**
     * to get value for counter
     */
    getCounterValue(){
        let {currentIndex, isExpanded} = this.state;
        let {loopLength} = this.props;
        if(!isExpanded || loopLength.length <= 1){
            return null;
        }
        let counterValue = CFields.getLoopLength(currentIndex, loopLength);
        const splitCounterValue = counterValue.split('|');
        return(
            <div className={styles.counter}>
                {
                    splitCounterValue.map((value, index) => {
                        return(
                            <React.Fragment key={`${index}_${value}`}>
                                <Counter index={index} value={value} setCurrentIndex={::this.setCurrentIndex} completeValue={splitCounterValue} loopLength={loopLength}/>
                                {
                                    index !== splitCounterValue.length - 1
                                    ?
                                        <span className={styles.splitter}>|</span>
                                    :
                                        null
                                }
                            </React.Fragment>
                        )
                    })
                }
            </div>
        )
    }

    render(){
        const {isExpanded, currentIndex} = this.state;
        let {fields, currentTable, selectedField} = this.props;
        if(fields.length === 0){
            return null;
        }
        const isDisabledPrevious = currentIndex === 0;
        const isDisabledNext = currentIndex === fields[0].values.length - 1;
        const hasExpansion = fields[0].values.length > 1;
        const hasLoopNavigation = isExpanded && fields[0].values.length > 1;
        const loopNavigationStyle = {top: fields.length === 1 ? 0 : '8px'};
        if(currentTable === CONNECTOR_FROM){
            loopNavigationStyle.left = '43%';
        } else{
            loopNavigationStyle.left = '28%';
        }
        fields = !isExpanded ? [fields[0]] : fields;
        return(
            <>
                {
                    hasExpansion ?
                        <TooltipFontIcon className={styles.expand} onClick={::this.toggleExpanded} tooltip={isExpanded ? 'minimize' : 'maximize'} value={isExpanded ? 'remove' : 'add'}/>
                        :
                        null
                }
                {
                    hasLoopNavigation
                        ?
                        <div className={styles.loop_navigation} style={loopNavigationStyle}>
                            <TooltipFontIcon tooltip={'Previous'} value={'keyboard_arrow_up'} className={`${styles.previous} ${isDisabledPrevious ? styles.disabled : ''}`} onClick={isDisabledPrevious ? null : ::this.decreaseCurrentIndex}/>
                            <span className={styles.current_index}>{currentIndex + 1}</span>
                            <TooltipFontIcon tooltip={'Next'} value={'keyboard_arrow_down'} className={`${styles.next} ${isDisabledNext ? styles.disabled : ''}`} onClick={isDisabledNext ? null : ::this.increaseCurrentIndex}/>
                        </div>
                        :
                        null
                }
                {this.getCounterValue()}
                <div className={styles.fields} style={{minHeight: hasLoopNavigation ? '64px' : ''}}>
                    {
                        fields.map((field, index) => {
                            let value = field.values[currentIndex];
                            const isStringValue = isString(value);
                            const valueStyle = {paddingLeft: fields.length > 3 ? '8px' : 0};
                            const nameStyle = {};
                            const dependenciesStyle = {};
                            let isSelected = false;
                            if(!isStringValue){
                                valueStyle.padding = '5px';
                                valueStyle.marginLeft = '-5px';
                            }
                            if(currentTable === CONNECTOR_FROM){
                                valueStyle.width = '50%';
                                nameStyle.width = '50%';
                            } else{
                                valueStyle.width = '33%';
                                nameStyle.width = '34%';
                                dependenciesStyle.width = '33%';
                            }
                            if(selectedField && selectedField.name === field.name){
                                isSelected = true;
                            }
                            return(
                                <React.Fragment key={field.name}>
                                    <div key={field.name} className={`${styles.field}`} style={nameStyle} title={field.name}>
                                        <span className={`${isSelected ? styles.selected_field: ''}`}>{field.name}</span>
                                    </div>
                                    <div
                                        className={`${styles.value}`}
                                        style={valueStyle}>
                                        {

                                            isStringValue
                                            ?
                                                <span title={value} style={{padding: '0 5px'}}>{value}</span>
                                            :
                                                <JsonBody bodyStyles={{top: 0}} readOnly={true} method={{request: {body: value}}} id={'key'}/>
                                        }
                                    </div>
                                    {
                                        currentTable === CONNECTOR_TO
                                        ?
                                            <div className={styles.dependencies} style={dependenciesStyle}>
                                                {
                                                    field.dependencies.map(dependency => {
                                                        return(
                                                            <span key={`${dependency.color}_${dependency.name}`} className={styles.dependency}>
                                                                {

                                                                    isString(dependency.values[currentIndex])
                                                                        ?
                                                                        <span className={styles.dependency_value} title={dependency.name} onClick={() => this.openDependency({...dependency, currentIndex})} style={{background: dependency.color}}>{dependency.values[currentIndex]}</span>
                                                                        :
                                                                        <span title={dependency.name}>
                                                                            <span className={styles.dependency_value} onClick={() => this.openDependency({...dependency, currentIndex})} style={{ background: dependency.color}}>{dependency.name}</span>
                                                                            <span className={styles.delimiter}>:</span>
                                                                            <JsonBody bodyStyles={{top: 0, right: 0}} readOnly={true} method={{request: {body: dependency.values[currentIndex]}}} id={'key'}/>
                                                                        </span>
                                                                }
                                                            </span>
                                                        )
                                                    })
                                                }
                                            </div>
                                        :
                                            null
                                    }
                                </React.Fragment>
                            );
                        })
                    }
                </div>
            </>
        );
    }
}

Fields.propTypes = {
    fields: PropTypes.array.isRequired,
};

Fields.defaultProps = {
    fields: [],
};

export default Fields;