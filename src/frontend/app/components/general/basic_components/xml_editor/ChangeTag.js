import React from 'react';
import PropTypes from 'prop-types';
import Input from "@basic_components/inputs/Input";
import CTag, {TAG_VALUE_TYPES} from "@classes/components/general/basic_components/CTag";
import styles from "@themes/default/general/basic_components";
import {RadioButton, RadioGroup} from "react-toolbox/lib/radio";
import {isArray, isString, setFocusById} from "@utils/app";
import Button from "@basic_components/buttons/Button";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

class ChangeTag extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            name: props.tag.name,
            valueType: props.mode === 'add' ? TAG_VALUE_TYPES.ITEM : props.tag.valueType,
            text: isString(props.tag.tags) ? props.tag.tags : '',
        }
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
        if(name === ''){
            return;
        }
        let tags = [];
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
        return(
            <div className={styles.change_tag_popup}>
                <TooltipFontIcon tooltip={'Close'} value={'close'} className={styles.close_icon} onClick={close}/>
                <Input id={`${tag.uniqueIndex}_name`} value={name} onChange={::this.changeName} onKeyDown={::this.pressKey} label={'Name'}/>
                <RadioGroup name='valueType' value={valueType} onChange={::this.changeValueType} className={`${styles.radio_group}`}>
                    <RadioButton label={'Empty'} value={TAG_VALUE_TYPES.EMPTY} className={`${styles.radio_button}`}/>
                    <RadioButton label={'Text'} value={TAG_VALUE_TYPES.TEXT} className={`${styles.radio_button}`}/>
                    <RadioButton label={'Item'} value={TAG_VALUE_TYPES.ITEM} className={`${styles.radio_button}`}/>
                </RadioGroup>
                {valueType === TAG_VALUE_TYPES.TEXT && <Input id={`${tag.uniqueIndex}_text`} value={text} onChange={::this.changeText} onKeyDown={::this.pressKey} label={'Text'}/>}
                <Button onClick={::this.change} title={mode === 'add' ? 'Add' : 'Update'}/>
            </div>
        )
    }
}

ChangeTag.propTypes = {
    parent: PropTypes.instanceOf(CTag),
    tag: PropTypes.instanceOf(CTag).isRequired,
    change: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
    mode: PropTypes.string,
};

ChangeTag.defaultProps = {
    mode: 'add',
};

export default ChangeTag;