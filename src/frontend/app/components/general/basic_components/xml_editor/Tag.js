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
import Property from "@basic_components/xml_editor/Property";
import styles from '@themes/default/general/basic_components.scss';
import CTag, {TAG_VALUE_TYPES} from "@classes/components/general/basic_components/xml_editor/CTag";
import {checkReferenceFormat, isString} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import ChangeProperty from "@basic_components/xml_editor/ChangeProperty";
import ChangeTag from "@basic_components/xml_editor/ChangeTag";
import ReferenceValues from "@basic_components/xml_editor/ReferenceValues";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";

const XML_TAG_INDENT = 15;


/**
 * Tag component for XmlEditor
 */
class Tag extends Component{
    constructor(props) {
        super(props);

        this.state = {
            hasDeleteTagIcon: false,
            hasAddPropertyIcon: false,
            hasMinimizerIcon: false,
            property: CProperty.createProperty('', '', props.tag),
            hasAddPropertyPopup: false,
            hasUpdateTagPopup: false,
            hasAddTagPopup: false,
            hasAddTagIcon: false,
            addTag: CTag.createTag('', null, props.tag, props.xml ? props.xml.xml : null),
            hasCopyToClipboardIcon: false,
        };
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
            hasDeleteTagIcon: false,
            hasAddPropertyIcon: false,
            hasAddTagIcon: false,
            hasCopyToClipboardIcon: false,
        });
    }

    /**
     * to show update tag popup window
     */
    showUpdateTagPopup(){
        this.setState({
            hasUpdateTagPopup: true,
        });
    }

    /**
     * to hide add tag popup window
     */
    hideUpdateTagPopup(){
        this.setState({
            hasUpdateTagPopup: false,
            hasDeleteTagIcon: false,
            hasAddPropertyIcon: false,
            hasAddTagIcon: false,
            hasCopyToClipboardIcon: false,
        });
    }

    /**
     * to show add property popup window
     */
    showAddPropertyPopup(){
        this.setState({
            hasAddPropertyPopup: true,
        });
    }

    /**
     * to hide add property popup window
     */
    hideAddPropertyPopup(){
        this.setState({
            hasAddPropertyPopup: false,
            property: CProperty.createProperty('', '', this.props.tag),
            hasDeleteTagIcon: false,
            hasAddPropertyIcon: false,
            hasAddTagIcon: false,
            hasCopyToClipboardIcon: false,
        });
    }

    /**
     * to show minimize icon for Tag
     */
    showMinimizerIcon(){
        this.setState({
            hasMinimizerIcon: true,
        });
    }

    /**
     * to hide minimize icon for Tag
     */
    hideMinimizerIcon(){
        this.setState({
            hasMinimizerIcon: false,
        });
    }

    /**
     * to show next icons: add property, add tag, copy to clipboard, delete tag
     */
    showTagIcons(){
        this.setState({
            hasDeleteTagIcon: true,
            hasAddPropertyIcon: true,
            hasAddTagIcon: true,
            hasCopyToClipboardIcon: true,
        });
    }

    /**
     * to hide next icons: add property, add tag, copy to clipboard, delete tag
     */
    hideTagIcons(){
        this.setState({
            hasDeleteTagIcon: false,
            hasAddPropertyIcon: false,
            hasAddTagIcon: false,
            hasCopyToClipboardIcon: false,
        });
    }

    /**
     * to delete subtag by index
     * @param e - event
     * @param index - subtag index
     */
    deleteTag(e, index){
        const {tag, update} = this.props;
        CXmlEditor.setLastEditElement(tag.tags[index], '', tag.tags[index].tags, 'remove');
        tag.removeTag(index);
        update();
    }

    /**
     * to minimize or maximize tag
     */
    toggleTag(){
        const {tag, update} = this.props;
        tag.minimized = !tag.minimized;
        update();
    }

    /**
     * to add property into tag
     */
    addProperty(property){
        const {translate, tag, update} = this.props;
        if(!tag.addProperty(property)){
            alert(translate('XML_EDITOR.PROPERTY.VALIDATIONS.UNIQUE_NAME'));
        }
        update();
    }

    /**
     * to copy to clipboard tag in xml string format
     */
    copyToClipboard(){
        const {tag} = this.props;
        tag.copyToClipboard();
    }

    renderProperties(){
        const {translate, tag, update, readOnly, ReferenceComponent, onReferenceClick} = this.props;
        return tag.properties.map(property => {
            return(
                <Property
                    key={`${property.name}`}
                    translate={translate}
                    tag={tag}
                    property={property}
                    update={update}
                    readOnly={readOnly}
                    ReferenceComponent={ReferenceComponent}
                    onReferenceClick={onReferenceClick}
                />
            );
        })
    }

    renderTagValue(){
        const {translate, tag} = this.props;
        let isReference = checkReferenceFormat(tag.tags);
        if(isReference){
            return (
                <ReferenceValues
                    translate={translate}
                    references={tag.tags}
                    styles={{
                        padding: '0 12px',
                        margin: '0 0 0 6px',
                        width: 0,
                        height: 0,
                        fontSize: '12px'
                    }}
                    maxVisible={4}
                    hasDelete={false}
                />
            );
        }
        return(
            <span>{tag.tags}</span>
        );
    }

    renderSubTags(){
        const {translate, tag, update, readOnly, ReferenceComponent, onReferenceClick, xml} = this.props;
        if(tag.minimized){
            return <TooltipFontIcon
                size={14}
                className={styles.expand_tag}
                tooltip={translate('XML_EDITOR.MORE')}
                value={'more_horiz'}
                onClick={::this.toggleTag}
            />;
        }
        if(isString(tag.tags)){
            return this.renderTagValue();
        }
        if(tag.tags.length === 0 && !readOnly){
            return (
                <div>
                    <TooltipFontIcon
                        id={`${tag.uniqueIndex}_add_tag`}
                        size={14}
                        className={styles.add_tag_icon_outside}
                        tooltip={translate('XML_EDITOR.ADD_ITEM')}
                        value={'add_circle_outline'}
                        onClick={::this.showAddTagPopup}
                    />
                </div>
            );
        }
        return tag.tags ? tag.tags.map((t, index) => {
            return <Tag
                key={`${t.name}_${index}`}
                translate={translate}
                xml={xml}
                tag={t}
                update={update}
                deleteTag={(e) => ::this.deleteTag(e, index)}
                readOnly={readOnly}
                ReferenceComponent={ReferenceComponent}
                onReferenceClick={onReferenceClick}
            />;
        }) : null;
    }

    render() {
        const {hasAddPropertyIcon, hasDeleteTagIcon, hasMinimizerIcon, hasAddPropertyPopup, property, hasUpdateTagPopup, hasAddTagPopup, addTag, hasAddTagIcon, hasCopyToClipboardIcon} = this.state;
        const {xml, translate, tag, isDeclaration, deleteTag, update, readOnly, ReferenceComponent, onReferenceClick} = this.props;
        const hasMinimizer = !isString(tag.tags) && tag.tags !== null && hasMinimizerIcon;
        const isMinimized = tag.minimized;
        return(
            <span onMouseOver={::this.showMinimizerIcon} onMouseLeave={::this.hideMinimizerIcon}>
                {hasMinimizer && <div className={styles.minimized_icon} style={{marginLeft: `${XML_TAG_INDENT - 10}px`}}><TooltipFontIcon size={14} tooltip={isMinimized ? translate('XML_EDITOR.MAXIMIZE') : translate('XML_EDITOR.MINIMIZE')} value={isMinimized ? 'add' : 'remove'} onClick={::this.toggleTag}/></div>}
                <div className={styles.tag} style={{paddingLeft: `${XML_TAG_INDENT}px`}}>
                    <span onMouseOver={::this.showTagIcons} onMouseLeave={::this.hideTagIcons} className={styles.tag_open}>
                        <span className={styles.bracket}>{`<${isDeclaration ? '?' : ''}`}</span>
                        <span className={`${styles.name_open} ${!readOnly ? styles.name_open_hovered : ''}`} onClick={!readOnly ? ::this.showUpdateTagPopup : null} id={`${tag.uniqueIndex}_tag_name`}>{tag.name}</span>
                        {hasUpdateTagPopup && !readOnly && <ChangeTag xml={xml} translate={translate} correspondedId={`${tag.uniqueIndex}_tag_name`} tag={tag} change={update} close={::this.hideUpdateTagPopup} mode={'update'} ReferenceComponent={ReferenceComponent} onReferenceClick={onReferenceClick}/>}
                        {hasAddTagPopup && !readOnly && <ChangeTag xml={xml} translate={translate} correspondedId={`${tag.uniqueIndex}_add_tag`} parent={tag} tag={addTag} change={update} close={::this.hideAddTagPopup} mode={'add'} ReferenceComponent={ReferenceComponent} onReferenceClick={onReferenceClick}/>}
                        {this.renderProperties()}
                        {hasAddPropertyIcon && !readOnly && <TooltipFontIcon size={14} id={`${tag.uniqueIndex}_add_property`} tooltip={translate('XML_EDITOR.ADD_PROPERTY')} value={'add_circle_outline'} className={styles.add_property_icon} onClick={::this.showAddPropertyPopup}/>}
                        {hasAddPropertyPopup && !readOnly && <ChangeProperty translate={translate} correspondedId={`${tag.uniqueIndex}_add_property`} property={property} change={::this.addProperty} close={::this.hideAddPropertyPopup} mode={'add'} ReferenceComponent={ReferenceComponent} onReferenceClick={onReferenceClick}/>}
                        {!tag.tags && <span className={styles.bracket}>{isDeclaration ? '?' : '/'}</span>}
                        <span className={styles.bracket}>{'>'}</span>
                        {hasDeleteTagIcon && !readOnly && <TooltipFontIcon size={14} tooltip={translate('XML_EDITOR.DELETE_TAG')} value={'delete'} className={styles.delete_icon} onClick={deleteTag ? deleteTag : null} style={{paddingLeft: hasAddTagIcon && tag.valueType !== TAG_VALUE_TYPES.TEXT && !isDeclaration ? '32px' : '16px'}}/>}
                        {hasCopyToClipboardIcon && <TooltipFontIcon size={14} id={`${tag.uniqueIndex}_copy_to_clipboard`} tooltip={translate('XML_EDITOR.COPY_TO_CLIPBOARD')} value={'keyboard'} style={{paddingLeft: hasAddTagIcon && tag.valueType !== TAG_VALUE_TYPES.TEXT && !readOnly && !isDeclaration  ? '16px': '0'}} className={styles.add_tag_icon_inside} onClick={::this.copyToClipboard}/>}
                        {hasAddTagIcon && !readOnly && tag.valueType !== TAG_VALUE_TYPES.TEXT && !isDeclaration && <TooltipFontIcon size={14} id={`${tag.uniqueIndex}_add_tag`} tooltip={translate('XML_EDITOR.ADD_ITEM')} value={'add_circle_outline'} className={styles.add_tag_icon_inside} onClick={::this.showAddTagPopup}/>}
                    </span>
                    {
                        tag.tags &&
                        <React.Fragment>
                            {this.renderSubTags()}
                            <span>
                                <span className={styles.bracket}>{'</'}</span>
                                <span className={styles.name_close}>{tag.name}</span>
                                <span className={styles.bracket}>{'>'}</span>
                            </span>
                        </React.Fragment>
                    }
                </div>
            </span>
        );
    }
}

Tag.propTypes = {
    xml: PropTypes.instanceOf(CXmlEditor).isRequired,
    tag: PropTypes.instanceOf(CTag).isRequired,
    isDeclaration: PropTypes.bool,
    update: PropTypes.func.isRequired,
    deleteTag: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
};

Tag.defaultProps = {
    isDeclaration: false,
    readOnly: false,
};


export default Tag;