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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Tag from "@app_component/base/input/xml_view/xml_editor/Tag";
import CXmlEditor from "./classes/CXmlEditor";
import styles from './basic_components.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import ChangeTag from "@app_component/base/input/xml_view/xml_editor/ChangeTag";
import CTag from "./classes/CTag";

export const OnReferenceClickContext = React.createContext(null);
/**
 * XmlEditor with References
 */
class XmlEditor extends Component{
    constructor(props) {
        super(props);
        const xml = CXmlEditor.createXmlEditor(props.xml);
        this.state = {
            xml,
            addTag: CTag.createTag('', null, null, xml.xml),
            hasAddTagPopup: false,
        };
    }

    /**
     * to add declaration in xml
     */
    addDeclaration(){
        const {xml} = this.state;
        xml.addDeclaration();
        this.updateXml();
    }

    /**
     * to show add tag popup window
     */
    showAddTagPopup(){
        this.setState({
            hasAddTagPopup: true,
        });
    }

    /**
     * to hide add tag popup window
     */
    hideAddTagPopup(){
        this.setState({
            hasAddTagPopup: false,
        });
    }

    /**
     * to delete all tags in xml
     */
    deleteCoreTag(){
        const {xml} = this.state;
        CXmlEditor.setLastEditElement(xml.tag, '', xml.tag.tags, 'remove');
        xml.removeCoreTag();
        this.updateXml();
    }

    /**
     * to delete declaration of xml
     */
    deleteDeclaration(){
        const {xml} = this.state;
        CXmlEditor.setLastEditElement(xml.declaration, '', xml.declaration.tags, 'remove');
        xml.removeDeclaration();
        this.updateXml();
    }

    /**
     * to update whole xml
     */
    updateXml(){
        const {xml} = this.state;
        const {afterUpdateCallback} = this.props;
        this.setState({xml},() => {
            if(afterUpdateCallback){
                afterUpdateCallback(xml);
            }}
        );
    }

    render() {
        const {xml, hasAddTagPopup, addTag} = this.state;
        const {translate, className, readOnly, ReferenceComponent, onReferenceClick, style} = this.props;
        return(
            <OnReferenceClickContext.Provider value={onReferenceClick}>
                <div className={`${styles.xml_editor} ${className}`} style={style}>
                    {xml && xml.declaration ?
                        <Tag translate={translate} tag={xml.declaration} xml={xml} isDeclaration update={() => this.updateXml()} deleteTag={() => this.deleteDeclaration()}
                             readOnly={readOnly} ReferenceComponent={ReferenceComponent}/>
                    :
                        <React.Fragment>
                            <TooltipFontIcon size={14} tooltip={translate('XML_EDITOR.ADD_DECLARATION')} value={<span>{'<?xml?>'}</span>} className={styles.add_declaration_icon} onClick={() => this.addDeclaration()}/>
                            <br/>
                        </React.Fragment>
                    }
                    {xml && xml.tag ?
                        <Tag translate={translate} tag={xml.tag} xml={xml} update={() => this.updateXml()} deleteTag={() => this.deleteCoreTag()}
                             readOnly={readOnly} ReferenceComponent={ReferenceComponent}/>
                    :
                        <React.Fragment>
                            <TooltipFontIcon id={`xml_add_tag`} size={14} tooltip={translate('XML_EDITOR.ADD_ITEM')} value={<span>{'<tag/>'}</span>} className={styles.add_first_tag_icon} onClick={() => this.showAddTagPopup()}/>
                            {
                                hasAddTagPopup && !readOnly &&
                                    <ChangeTag xml={xml} translate={translate} correspondedId={`xml_add_tag`} parent={xml} tag={addTag} change={() => this.updateXml()} close={() => this.hideAddTagPopup()}
                                        mode={'add'} ReferenceComponent={ReferenceComponent}/>
                            }
                        </React.Fragment>
                    }
                </div>
            </OnReferenceClickContext.Provider>
        );
    }
}

XmlEditor.propTypes = {
    afterUpdateCallback: PropTypes.func,
    className: PropTypes.string,
    readOnly: PropTypes.bool,
    translate: PropTypes.func.isRequired,
};

XmlEditor.defaultProps = {
    style: null,
    className: '',
    readOnly: false,
    ReferenceComponent: null,
    onReferenceClick: null,
};

export default XmlEditor;