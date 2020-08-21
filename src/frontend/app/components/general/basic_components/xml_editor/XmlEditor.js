import React from 'react';
import PropTypes from 'prop-types';
import Tag from "@basic_components/xml_editor/Tag";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";
import styles from '@themes/default/general/basic_components.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import ChangeTag from "@basic_components/xml_editor/ChangeTag";
import CTag from "@classes/components/general/basic_components/xml_editor/CTag";
import TooltipText from "@basic_components/tooltips/TooltipText";

class XmlEditor extends React.Component{
    constructor(props) {
        super(props);
        const xml = CXmlEditor.createXmlEditor(props.xml);
        this.state = {
            xml,
            addTag: CTag.createTag('', null, xml),
            hasAddTagPopup: false,
        };
    }

    addDeclaration(){
        const {xml} = this.state;
        xml.addDeclaration();
        this.updateXml();
    }

    showAddTagPopup(){
        this.setState({
            hasAddTagPopup: true,
        });
    }

    hideAddTagPopup(){
        this.setState({
            hasAddTagPopup: false,
        });
    }

    updateXml(){
        const {xml} = this.state;
        const {afterUpdateCallback} = this.props;
        this.setState({xml},() => {
            if(afterUpdateCallback){
                afterUpdateCallback(xml);
            }}
        );
    }

    deleteCoreTag(){
        const {xml} = this.state;
        xml.removeCoreTag();
        this.updateXml();
    }

    deleteDeclaration(){
        const {xml} = this.state;
        xml.removeDeclaration();
        this.updateXml();
    }

    render() {
        const {xml, hasAddTagPopup, addTag} = this.state;
        const {className, readOnly, ReferenceComponent, onReferenceClick} = this.props;
        return(
            <div className={`${styles.xml_editor} ${className}`}>
                {xml && xml.declaration ?
                    <Tag tag={xml.declaration} isDeclaration update={::this.updateXml} deleteTag={::this.deleteDeclaration}
                         readOnly={readOnly} ReferenceComponent={ReferenceComponent} onReferenceClick={onReferenceClick}/>
                :
                    <React.Fragment>
                        <TooltipFontIcon tooltip={'Add Declaration'} value={<span>{'<?xml?>'}</span>} className={styles.add_declaration_icon} onClick={::this.addDeclaration}/>
                        <br/>
                    </React.Fragment>
                }
                {xml && xml.tag ?
                    <Tag tag={xml.tag} update={::this.updateXml} deleteTag={::this.deleteCoreTag}
                         readOnly={readOnly} ReferenceComponent={ReferenceComponent} onReferenceClick={onReferenceClick}/>
                :
                    <React.Fragment>
                        <TooltipFontIcon id={`xml_add_tag`} tooltip={'Add Item'} value={<span>{'<tag/>'}</span>} className={styles.add_first_tag_icon} onClick={::this.showAddTagPopup}/>
                        {
                            hasAddTagPopup && !readOnly &&
                                <ChangeTag correspondedId={`xml_add_tag`} parent={xml} tag={addTag} change={::this.updateXml} close={::this.hideAddTagPopup}
                                    mode={'add'} ReferenceComponent={ReferenceComponent} onReferenceClick={onReferenceClick}/>
                        }
                    </React.Fragment>
                }
            </div>
        );
    }
}

XmlEditor.propTypes = {
    afterUpdateCallback: PropTypes.func,
    className: PropTypes.string,
    readOnly: PropTypes.bool,
};

XmlEditor.defaultProps = {
    className: '',
    readOnly: false,
    ReferenceComponent: null,
    onReferenceClick: null,
};

export default XmlEditor;