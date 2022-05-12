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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import appStyles from '@entity/connection/components/themes/default/general/basic_components.scss';
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";
import CTag from "@entity/connection/components/classes/components/general/basic_components/xml_editor/CTag";
import CProperty from "@entity/connection/components/classes/components/general/basic_components/xml_editor/CProperty";
import {ATTRIBUTES_MARK} from "@entity/connection/components/classes/components/content/invoker/CBody";


/**
 * ReferenceValues component to display line of references
 */
class ReferenceValues extends Component{

    /**
     * to delete reference by index
     * @param index - of the reference
     */
    deleteReference(index){
        const {references} = this.props;
        let pointers = references.split(';');
        if(index >= 0 && index < pointers.length) {
            pointers.splice(index, 1);
            this.props.updateReferences(pointers.join(';'));
        }
    }

    onReferenceClick(e){
        const {tag, property, onReferenceClick} = this.props;
        if(typeof onReferenceClick === 'function'){
            if(tag){
                let namespace = tag.getNamespaces();
                let name = tag.name;
                if(property){
                    namespace.push(name);
                    name = `${ATTRIBUTES_MARK}${property.name}`;
                    e.preventDefault();
                }
                onReferenceClick(null, {namespace, variable: {name}})
            }
        }
    }

    render() {
        const {translate, references, maxVisible, hasDelete} = this.props;
        let {styles} = this.props;
        if(typeof references === 'string') {
            let pointers = references.split(';');
            if (pointers.length > 0) {
                return pointers.map((p, key) => {
                    let extraStyles = {};
                    let pointer = p.split('.');
                    if (pointer.length > 3) {
                        if(key < maxVisible) {
                            if(key === 0){
                                extraStyles.marginLeft = 0;
                            }
                            return (
                                <React.Fragment key={key}>
                                    <TooltipFontIcon
                                        onClick={(a) => this.onReferenceClick(a)}
                                        className={appStyles.reference_value}
                                        tooltip={pointer.slice(2, pointer.length).join('.').replace('[]', '')}
                                        value={<span/>}
                                        style={{background: pointer[0], ...styles, ...extraStyles}}
                                    />
                                    {hasDelete && <TooltipFontIcon size={14} tooltip={translate('XML_EDITOR.DELETE_ICON')} onClick={() => this.deleteReference(key)} value={'delete'} className={appStyles.reference_value_delete}/>}
                                </React.Fragment>
                            );
                        } else{
                            if(key === maxVisible) {
                                return <span
                                    key={key}
                                    title={translate('REJECTED_REQUESTS.ERROR_FETCH_LIST', {number: maxVisible})}
                                    style={{margin: '0 2px'}}
                                >...</span>;
                            }
                        }
                    }
                });
            }
        }
        return null;
    }
}

ReferenceValues.propTypes = {
    styles: PropTypes.object,
    tag: PropTypes.instanceOf(CTag),
    property: PropTypes.instanceOf(CProperty),
    onReferenceClick: PropTypes.func,
};

ReferenceValues.defaultProps = {
    references: '',
    maxVisible: 1000,
    hasDelete: true,
    styles: {},
    onReferenceClick: null,
};

export default ReferenceValues;