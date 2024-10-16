/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Input from "@basic_components/inputs/Input";
import {checkReferenceFormat, setFocusById} from "@application/utils/utils";
import Reference from "@app_component/base/input/xml_view/xml_editor/Reference";
import ReferenceValues from "@app_component/base/input/xml_view/xml_editor/ReferenceValues";
import ValueType from "@app_component/base/input/xml_view/xml_editor/ValueType";
import styles from "./form_methods.scss";
import ToolboxThemeInput from "@root/components/hocs/ToolboxThemeInput";
import CTag from "./classes/CTag";
import CProperty from "./classes/CProperty";
import {OnReferenceClickContext} from "@app_component/base/input/xml_view/xml_editor/XmlEditor";


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
        const {translate, uniqueIndex, ReferenceComponent, pressKey, label, tag, property} = this.props;
        if(valueType === 'reference'){
            if(ReferenceComponent) {
                return (
                    <React.Fragment>
                        {
                            references !== '' &&
                                <ToolboxThemeInput style={{paddingBottom: 0}} inputElementClassName={styles.multiselect_label} label={translate('XML_EDITOR.LIST_OF_REFERENCES')}>
                                    <div style={{position: 'relative', display: 'flex', width: '100%', flexWrap: 'wrap', padding: '0 1px'}}>
                                        <OnReferenceClickContext.Consumer>
                                            {value =>
                                                <ReferenceValues
                                                    onReferenceClick={value}
                                                    styles={{
                                                        display: 'inline-block'
                                                    }}
                                                    property={property}
                                                    tag={tag}
                                                    translate={translate}
                                                    references={references}
                                                    updateReferences={(a) => this.updateReferences(a)}
                                                />}
                                        </OnReferenceClickContext.Consumer>
                                    </div>
                                </ToolboxThemeInput>
                        }
                        <Reference id={`${uniqueIndex}_value`}  translate={translate} ReferenceComponent={ReferenceComponent} add={(a) => this.change(a)}/>
                    </React.Fragment>
                );
            }
        }
        return(
            <Input id={`${uniqueIndex}_value`} value={notReferenceValue} onChange={(a) => this.changeNotReferenceValue(a)} onKeyDown={pressKey} label={label}/>
        );
    }

    render(){
        const {valueType} = this.state;
        const {translate, ReferenceComponent} = this.props;
        return (
            <React.Fragment>
                {ReferenceComponent && <ValueType translate={translate} valueType={valueType} changeValueType={(a) => this.changeValueType(a)}/>}
                {this.renderValue()}
            </React.Fragment>
        )
    }
}

Value.propTypes = {
    tag: PropTypes.instanceOf(CTag),
    property: PropTypes.instanceOf(CProperty),
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