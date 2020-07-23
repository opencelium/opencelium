import React from 'react';
import PropTypes from 'prop-types';
import styles from "@themes/default/general/basic_components";
import Input from "@basic_components/inputs/Input";
import Button from "@basic_components/buttons/Button";
import CProperty from "@classes/components/general/basic_components/CProperty";
import {findTopLeft, isNumber, setFocusById} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import ReactDOM from "react-dom";

class ChangeProperty extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            name: props.property.name,
            value: props.property.value,
        };
        const {top, left} = findTopLeft(props.correspondedId);
        this.top = top;
        this.left = left;
    }


    componentDidMount() {
        const {property} = this.props;
        setFocusById(`${property.uniqueIndex}_name`);
    }

    changeName(name){
        this.setState({name});
    }

    changeValue(value){
        this.setState({value});
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
        const {name, value} = this.state;
        const {change, property, close, mode} = this.props;
        if(name === ''){
            alert('Name is a required field');
            return;
        }
        if(isNumber(name)){
            alert('Name cannot be a number');
            return;
        }
        if(value === ''){
            alert('Value is a required field');
            return;
        }
        property.update(name, value);
        switch(mode){
            case 'add':
                change(property);
                break;
            case 'update':
                change();
                break;
        }
        close();
    }

    render(){
        const {name, value} = this.state;
        const {property, mode, close} = this.props;
        return ReactDOM.createPortal(
            <div className={styles.change_popup} style={{top: this.top, left: this.left}}>
                <TooltipFontIcon tooltip={'Close'} value={'close'} className={styles.close_icon} onClick={close}/>
                <Input id={`${property.uniqueIndex}_name`} value={name} onChange={::this.changeName} onKeyDown={::this.pressKey} label={'Name'}/>
                <Input id={`${property.uniqueIndex}_value`} value={value} onChange={::this.changeValue} onKeyDown={::this.pressKey} label={'Value'}/>
                <Button onClick={::this.change} title={mode === 'add' ? 'Add' : 'Update'}/>
            </div>,
            document.getElementById('oc_modal')
        )
    }
}

ChangeProperty.propTypes = {
    property: PropTypes.instanceOf(CProperty).isRequired,
    change: PropTypes.func.isRequired,
    close: PropTypes.func.isRequired,
    mode: PropTypes.string,
    correspondedId: PropTypes.string.isRequired,
};

ChangeProperty.defaultProps = {
    mode: 'add',
};

export default ChangeProperty;