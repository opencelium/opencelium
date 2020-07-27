import ReactDOM from 'react-dom';
import React from 'react';
import PropTypes from 'prop-types';
import Input from "@basic_components/inputs/Input";
import CTag, {TAG_VALUE_TYPES} from "@classes/components/general/basic_components/CTag";
import styles from "@themes/default/general/basic_components";
import {RadioButton, RadioGroup} from "react-toolbox/lib/radio";
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
import CXmlEditor from "@classes/components/general/basic_components/CXmlEditor";

class ChangeTag extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            name: props.tag.name ? props.tag.name : '',
            valueType: props.mode === 'add' ? TAG_VALUE_TYPES.ITEM : props.tag.valueType,
            text: isString(props.tag.tags) ? props.tag.tags : '',
        }
        const {top, left} = findTopLeft(props.correspondedId);
        this.top = top;
        this.left = left;
    }

    componentDidMount() {
        const {tag} = this.props;
        setFocusById(`${tag.uniqueIndex}_name`);
    }

    changeName(name){
        this.setState({
            name,
        });
    }

    changeValueType(valueType){
        this.setState({
            valueType,
        });
    }

    changeText(text){
        this.setState({
            text,
        });
    }

    pressKey(e){
        if(e.which === 27){
            this.props.close();
        }
        if(e.keyCode === 13){
            this.change();
        }
    }

    change(){
        const {name, valueType, text} = this.state;
        const {change, tag, close, mode, parent} = this.props;
        if(valueType !== TAG_VALUE_TYPES.CLIPBOARD) {
            if (name === '') {
                alert('Name is a required field');
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
                        switch (mode) {
                            case 'add':
                                parent.addTag(tags);
                                break;
                            case 'update':
                                tag.updateTag(tags);
                                break;
                        }
                        change();
                        close();
                    } catch(e){
                        alert('Please, check the xml format');
                    }
                });
                return;
        }
        switch(mode){
            case 'add':
                parent.addTag(name, tags);
                break;
            case 'update':
                tag.updateTag(name, tags);
                break;
        }
        change();
        close();
    }

    render(){
        const {name, valueType, text} = this.state;
        const {tag, mode, close} = this.props;
        return ReactDOM.createPortal(
            <div className={styles.change_tag_popup} style={{left: this.left, top: this.top}}>
                <TooltipFontIcon tooltip={'Close'} value={'close'} className={styles.close_icon} onClick={close}/>
                <RadioGroup name='valueType' value={valueType} onChange={::this.changeValueType} className={`${styles.radio_group}`}>
                    <RadioButton label={'Empty'} value={TAG_VALUE_TYPES.EMPTY} className={`${styles.radio_button}`} theme={{radio: `${styles.radio_button_radio}`, text: `${styles.radio_button_text}`}}/>
                    <RadioButton label={'Text'} value={TAG_VALUE_TYPES.TEXT} className={`${styles.radio_button}`} theme={{radio: `${styles.radio_button_radio}`, text: `${styles.radio_button_text}`}}/>
                    <RadioButton label={'Item'} value={TAG_VALUE_TYPES.ITEM} className={`${styles.radio_button}`} theme={{radio: `${styles.radio_button_radio}`, text: `${styles.radio_button_text}`}}/>
                    <RadioButton label={'From Clipboard'} value={TAG_VALUE_TYPES.CLIPBOARD} className={`${styles.radio_button}`} theme={{radio: `${styles.radio_button_radio}`, text: `${styles.radio_button_text}`}}/>
                </RadioGroup>
                {valueType !== TAG_VALUE_TYPES.CLIPBOARD && <Input id={`${tag.uniqueIndex}_name`} value={name} onChange={::this.changeName} onKeyDown={::this.pressKey} label={'Name'}/>}
                {valueType === TAG_VALUE_TYPES.TEXT && <Input id={`${tag.uniqueIndex}_text`} value={text} onChange={::this.changeText} onKeyDown={::this.pressKey} label={'Text'}/>}
                <Button onClick={::this.change} title={mode === 'add' ? 'Add' : 'Update'}/>
            </div>,
            document.getElementById('oc_modal')
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