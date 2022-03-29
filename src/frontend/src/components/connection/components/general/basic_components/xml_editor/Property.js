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
import styles from '@themes/default/general/basic_components.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CTag from "@classes/components/general/basic_components/xml_editor/CTag";
import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import ChangeProperty from "@basic_components/xml_editor/ChangeProperty";
import {checkReferenceFormat} from "@utils/app";
import ReferenceValues from "@basic_components/xml_editor/ReferenceValues";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";
import {OnReferenceClickContext} from "@basic_components/xml_editor/XmlEditor";

/**
 * Property component for XmlEditor
 */
class Property extends Component{
    constructor(props) {
        super(props);

        this.state = {
            hasRemoveIcon: false,
            hasUpdatePopup: false,
        };
    }

    /**
     * to show remove icon
     */
    showRemoveIcon(){
        this.setState({
            hasRemoveIcon: true,
        });
    }

    /**
     * to hide remove icon
     */
    hideRemoveIcon(){
        this.setState({
            hasRemoveIcon: false,
        });
    }

    /**
     * to show update popup window
     */
    showUpdatePopup(){
        this.setState({
            hasUpdatePopup: true,
        });
    }

    /**
     * to hide update popup window
     */
    hideUpdatePopup(){
        this.setState({
            hasUpdatePopup: false,
        });
    }

    /**
     * to remove this property
     */
    removeProperty(){
        const {tag, property, update} = this.props;
        CXmlEditor.setLastEditElement(property, '', property.value, 'remove');
        tag.removeProperty(property.name);
        update();
    }

    renderValue(){
        const {translate, property, tag} = this.props;
        let isReference = checkReferenceFormat(property.value);
        if(isReference){
            return (
                <span>
                    =
                    <OnReferenceClickContext.Consumer>
                        {value => <ReferenceValues onReferenceClick={value} translate={translate} tag={tag} property={property} references={property.value} styles={{padding: '0 12px', margin: '0 0 0 6px', width: 0, height: 0,fontSize: '12px'}} maxVisible={4} hasDelete={false}/>}
                    </OnReferenceClickContext.Consumer>
                </span>
            );
        }
        return(
            <span className={styles.value}>{`="${property.value}"`}</span>
        );
    }

    render() {
        const {hasRemoveIcon, hasUpdatePopup} = this.state;
        const {translate, property, update, readOnly, ReferenceComponent, tag} = this.props;
        return(
            <span style={{position: 'relative', display: 'inline-block'}}>
                <span id={`${property.uniqueIndex}_property`} className={`${styles.property} ${!readOnly ? styles.property_hovered : ''}`}>
                    <span className={styles.name} onMouseOver={!readOnly ? () => this.showRemoveIcon() : null} onMouseLeave={() => this.hideRemoveIcon()} onClick={!readOnly ? () => this.showUpdatePopup() : null}>{property.name}</span>
                    {this.renderValue()}
                    {hasRemoveIcon && !readOnly && <TooltipFontIcon size={14} tooltip={translate('XML_EDITOR.DELETE_ATTRIBUTE')} value={'delete'} className={styles.remove_icon} onClick={() => this.removeProperty()}/>}
                </span>
                {
                    hasUpdatePopup && !readOnly &&
                        <ChangeProperty tag={tag} translate={translate} correspondedId={`${property.uniqueIndex}_property`} property={property} change={update} close={() => this.hideUpdatePopup()}
                                        mode={'update'} ReferenceComponent={ReferenceComponent}/>
                }
            </span>
        );
    }

}

Property.propTypes = {
    property: PropTypes.instanceOf(CProperty).isRequired,
    update: PropTypes.func.isRequired,
    tag: PropTypes.instanceOf(CTag).isRequired,
    readOnly: PropTypes.bool,
};

Property.defaultProps = {
    readOnly: false,
};


export default Property;