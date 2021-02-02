import ReactDOM from 'react-dom';
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Input from "@basic_components/inputs/Input";
import CTag, {TAG_VALUE_TYPES} from "@classes/components/general/basic_components/xml_editor/CTag";
import styles from "@themes/default/general/basic_components";
import {
    checkXmlTagFormat,
    findTopLeft,
    getStringFromClipboard,
    isArray,
    isString,
    setFocusById
} from "@utils/app";
import Button from "@basic_components/buttons/Button";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";
import TagType from "@basic_components/xml_editor/TagType";
import Value from "@basic_components/xml_editor/Value";

/**
 * ChangeTag component to add or update Tag
 */
class ChangeTag extends Component{
    constructor(props) {
        super(props);

        this.state = {
            name: props.tag.name ? props.tag.name : '',
            valueType: props.mode === 'add' ? TAG_VALUE_TYPES.ITEM : props.tag.valueType,
            text: isString(props.tag.tags) ? props.tag.tags : '',
        };
        const {top, left} = findTopLeft(props.correspondedId);
        this.top = top;
        this.left = left;
    }

    componentDidMount() {
        const {tag} = this.props;
        setFocusById(`${tag.uniqueIndex}_name`);
    }

    /**
     * to change name
     */
    changeName(name){
        this.setState({
            name,
        });
    }

    /**
     * to change value type
     */
    changeValueType(valueType){
        const {tag} = this.props;
        this.setState({
            valueType,
        });
        if(valueType !== TAG_VALUE_TYPES.CLIPBOARD) {
            setFocusById(`${tag.uniqueIndex}_name`);
        }
    }

    /**
     * to change text
     */
    changeText(text){
        this.setState({
            text,
        });
    }

    /**
     * to press key in name input
     */
    pressKey(e){
        if(e.which === 27){
            this.props.close();
        }
        if(e.keyCode === 13){
            this.change();
        }
    }

    /**
     * to change tag (add or update)
     */
    change(){
        const {name, valueType, text} = this.state;
        const {translate, change, tag, close, mode, parent, ReferenceComponent} = this.props;
        let referenceToNewTag = null;
        if(valueType !== TAG_VALUE_TYPES.CLIPBOARD) {
            if (name === '') {
                alert(translate('XML_EDITOR.TAG.VALIDATIONS.REQUIRED_NAME'));
                return;
            }
            if (!checkXmlTagFormat(name)) {
                return;
            }
        }
        let tags = [];
        let clipboardPromise = '';
        let clipboardXml = null;
        switch (valueType) {
            case TAG_VALUE_TYPES.EMPTY:
                tags = null;
                break;
            case TAG_VALUE_TYPES.TEXT:
                tags = text;
                break;
            case TAG_VALUE_TYPES.ITEM:
                tags = isArray(tag.tags) ? tag.tags : [];
                break;
            case TAG_VALUE_TYPES.CLIPBOARD:
                clipboardPromise = getStringFromClipboard();
                clipboardPromise.then(text => {
                    try {
                        clipboardXml = CXmlEditor.createXmlEditor(text);
                        tags = clipboardXml ? clipboardXml.tag : [];
                        tags.parent = parent;
                        switch (mode) {
                            case 'add':
                                referenceToNewTag = parent.addTag(tags);
                                break;
                            case 'update':
                                tag.updateTag(tags);
                                break;
                        }
                        if(referenceToNewTag !== null){
                            CXmlEditor.setLastEditElement(referenceToNewTag, referenceToNewTag.tags, referenceToNewTag.tags, mode);
                        } else{
                            CXmlEditor.setLastEditElement(tag, tag.tags, tag.tags, mode);
                        }
                        change();
                        close();
                    } catch(e){
                        alert(translate('XML_EDITOR.TAG.VALIDATIONS.WRONG_FORMAT'));
                    }
                });
                return;
        }
        switch(mode){
            case 'add':
                referenceToNewTag = parent.addTag(name, tags);
                break;
            case 'update':
                tag.updateTag(name, tags);
                break;
        }
        if(valueType === TAG_VALUE_TYPES.TEXT){
            if(referenceToNewTag !== null){
                CXmlEditor.setLastEditElement(referenceToNewTag, text, referenceToNewTag.tags, mode);
            } else{
                CXmlEditor.setLastEditElement(tag, text, tag.tags, mode);
            }
        }
        if(ReferenceComponent) {
            let referenceDiv = document.getElementById(ReferenceComponent.id);
            if (referenceDiv) {
                referenceDiv.innerText = '';
            }
        }
        change();
        close();
    }

    render(){
        const {name, valueType, text} = this.state;
        const {translate, tag, mode, close, ReferenceComponent} = this.props;
        return ReactDOM.createPortal(
            <div className={styles.change_tag_popup} style={{left: this.left, top: this.top}}>
                <TooltipFontIcon size={14} isButton={true} tooltip={translate('XML_EDITOR.CLOSE')} value={'close'} className={styles.close_icon} onClick={close}/>
                <TagType translate={translate} valueType={valueType} changeValueType={::this.changeValueType}/>
                {valueType !== TAG_VALUE_TYPES.CLIPBOARD && <Input id={`${tag.uniqueIndex}_name`} value={name} onChange={::this.changeName} onKeyDown={::this.pressKey} label={translate('XML_EDITOR.TAG.NAME')} theme={{input: styles.change_tag_name}}/>}
                {valueType === TAG_VALUE_TYPES.TEXT && <Value translate={translate} ReferenceComponent={ReferenceComponent} changeValue={::this.changeText} uniqueIndex={tag.uniqueIndex} value={text} pressKey={::this.pressKey} label={translate('XML_EDITOR.TAG.TEXT')}/>}
                <Button onClick={::this.change} title={mode === 'add' ? translate('XML_EDITOR.TAG.ADD') : translate('XML_EDITOR.TAG.UPDATE')}/>
            </div>,
            document.getElementById('oc_xml_modal')
        );
    }
}

ChangeTag.propTypes = {
    parent: PropTypes.instanceOf(CTag),
    tag: PropTypes.instanceOf(CTag).isRequired,
    change: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
    mode: PropTypes.string,
    correspondedId: PropTypes.string.isRequired,
};

ChangeTag.defaultProps = {
    mode: 'add',
};

export default ChangeTag;