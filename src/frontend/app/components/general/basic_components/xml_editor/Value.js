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
import Input from "@basic_components/inputs/Input";
import {checkReferenceFormat, setFocusById} from "@utils/app";
import Reference from "@basic_components/xml_editor/Reference";
import ReferenceValues from "@basic_components/xml_editor/ReferenceValues";
import ValueType from "@basic_components/xml_editor/ValueType";
import styles from "@themes/default/general/form_methods";
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";


/**
 * Value component to display value of the Tag (TAG_VALUE_TYPES.TEXT) or of the Property
 */
class Value extends Component{
    constructor(props) {
        super(props);
        let hasReferences = checkReferenceFormat(props.value);
        this.state = {
            valueType: hasReferences ? 'reference' : 'text',
            references: hasReferences ? props.value : '',
            notReferenceValue: hasReferences ? '' : props.value,
        };
    }

    /**
     * to change not reference value
     */
    changeNotReferenceValue(notReferenceValue){
        this.setState({notReferenceValue}, this.props.changeValue(notReferenceValue, false));
    }

    /**
     * to change value type
     */
    changeValueType(valueType){
        const {uniqueIndex} = this.props;
        this.setState({valueType});
        setFocusById(`${uniqueIndex}_value`);
    }

    /**
     * to update references in this component
     */
    updateReferences(references){
        const {changeValue} = this.props;
        changeValue(references, true);
        this.setState({
            references,
        });
    }

    /**
     * to change references in XmlEditor
     */
    change(){
        const {references} = this.state;
        const {ReferenceComponent, changeValue} = this.props;
        let referenceDiv = document.getElementById(ReferenceComponent.id);
        let newReferences = references;
        if (checkReferenceFormat(referenceDiv.innerText)) {
            newReferences = references ? `${references};${referenceDiv.innerText}` : referenceDiv.innerText;
            changeValue(newReferences, true);
            referenceDiv.innerText = '';
            this.setState({
                references: newReferences,
            });
        }
    }

    renderValue(){
        const {valueType, references, notReferenceValue} = this.state;
        const {translate, uniqueIndex, ReferenceComponent, pressKey, label} = this.props;
        if(valueType === 'reference'){
            if(ReferenceComponent) {
                return (
                    <React.Fragment>
                        {
                            references !== '' &&
                                <ToolboxThemeInput style={{paddingBottom: 0}} inputElementClassName={styles.multiselect_label} label={translate('XML_EDITOR.LIST_OF_REFERENCES')}>
                                    <div style={{position: 'relative', display: 'flex', width: '100%', flexWrap: 'wrap', padding: '0 1px'}}>
                                        <ReferenceValues
                                            styles={{
                                                display: 'inline-block'
                                            }}
                                            translate={translate}
                                            references={references}
                                            updateReferences={::this.updateReferences}
                                        />
                                    </div>
                                </ToolboxThemeInput>
                        }
                        <Reference id={`${uniqueIndex}_value`}  translate={translate} ReferenceComponent={ReferenceComponent} add={::this.change}/>
                    </React.Fragment>
                );
            }
        }
        return(
            <Input id={`${uniqueIndex}_value`} value={notReferenceValue} onChange={::this.changeNotReferenceValue} onKeyDown={pressKey} label={label}/>
        );
    }

    render(){
        const {valueType} = this.state;
        const {translate, ReferenceComponent} = this.props;
        return (
            <React.Fragment>
                {ReferenceComponent && <ValueType translate={translate} valueType={valueType} changeValueType={::this.changeValueType}/>}
                {this.renderValue()}
            </React.Fragment>
        )
    }
}

Value.propTypes = {
    value: PropTypes.string.isRequired,
    changeValue: PropTypes.func.isRequired,
    uniqueIndex: PropTypes.string.isRequired,
};

Value.defaultProps = {
    pressKey: null,
    label: 'Value',
    ReferenceComponent: null,
};

export default Value;