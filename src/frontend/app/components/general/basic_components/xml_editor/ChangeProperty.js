import React from 'react';
import PropTypes from 'prop-types';
import Input from "@basic_components/inputs/Input";
import Button from "@basic_components/buttons/Button";
import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import {checkReferenceFormat, findTopLeft, isNumber, setFocusById} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import ReactDOM from "react-dom";
import Reference from "@basic_components/xml_editor/Reference";
import ReferenceValues from "@basic_components/xml_editor/ReferenceValues";
import ValueType from "@basic_components/xml_editor/ValueType";
import theme from "react-toolbox/lib/input/theme.css";
import basicStyles from "@themes/default/general/basic_components";
import styles from "@themes/default/general/form_methods";

class ChangeProperty extends React.Component{
    constructor(props) {
        super(props);
        let hasReferences = checkReferenceFormat(props.property.value);
        this.state = {
            name: props.property.name,
            valueType: hasReferences ? 'reference' : 'text',
            value: hasReferences ? '' : props.property.value,
            references: hasReferences ? props.property.value : '',
        };
        const {top, left} = findTopLeft(props.correspondedId);
        this.top = top;
        this.left = left;
    }


    componentDidMount() {
        const {property} = this.props;
        setFocusById(`${property.uniqueIndex}_name`);
    }

    changeValueType(valueType){
        this.setState({valueType});
    }

    changeName(name){
        this.setState({name});
    }

    changeValue(value){
        this.setState({
            value,
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

    updateReferences(references){
        const {name} = this.state;
        const {change, property, mode, ReferenceComponent} = this.props;
        property.update(name, references);
        switch(mode){
            case 'add':
                change(property);
                break;
            case 'update':
                change();
                break;
        }
        let referenceDiv = document.getElementById(ReferenceComponent.id);
        referenceDiv.innerText = '';
        this.setState({
            references,
        });

    }

    change(doClose = true){
        const {name, value, valueType, references} = this.state;
        const {change, property, close, mode, ReferenceComponent} = this.props;
        let newReferences = references;
        if(name === ''){
            alert('Name is a required field');
            return;
        }
        if(isNumber(name)){
            alert('Name cannot be a number');
            return;
        }
        if(valueType === 'text') {
            if(value === ''){
                alert('Value is a required field');
                return;
            }
            property.update(name, value);
        } else{
            let referenceDiv = document.getElementById(ReferenceComponent.id);
            if (checkReferenceFormat(referenceDiv.innerText)) {
                newReferences = references ? `${references};${referenceDiv.innerText}` : referenceDiv.innerText;
                property.update(name, newReferences);
                referenceDiv.innerText = '';
            }
        }
        switch(mode){
            case 'add':
                change(property);
                break;
            case 'update':
                change();
                break;
        }
        if(doClose) {
            close();
        } else{
            this.setState({
                references: newReferences,
            });
        }
    }

    renderValue(){
        const {value, valueType, references} = this.state;
        const {property, ReferenceComponent} = this.props;
        if(valueType === 'reference'){
            if(ReferenceComponent) {
                return (
                    <React.Fragment>
                        {
                            references !== '' &&

                                <div className={`${theme.input}`} style={{paddingBottom: 0}}>
                                    <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                                    <div style={{position: 'relative', display: 'flex', width: '100%', flexWrap: 'wrap', padding: '0 1px'}}>
                                        <ReferenceValues references={references} updateReferences={::this.updateReferences}/>
                                    </div>
                                    <span className={theme.bar}/>
                                    <label className={theme.label}>{'List of references'}</label>
                                </div>
                        }
                        <Reference ReferenceComponent={ReferenceComponent} add={::this.change}/>
                    </React.Fragment>
                );
            }
        }
        return(
            <Input id={`${property.uniqueIndex}_value`} value={value} onChange={::this.changeValue} onKeyDown={::this.pressKey} label={'Value'}/>
        );
    }

    render(){
        const {name, valueType} = this.state;
        const {property, mode, close} = this.props;
        return ReactDOM.createPortal(
            <div className={basicStyles.change_popup} style={{top: this.top, left: this.left}}>
                <TooltipFontIcon tooltip={'Close'} value={'close'} className={basicStyles.close_icon} onClick={close}/>
                <Input id={`${property.uniqueIndex}_name`} value={name} onChange={::this.changeName} onKeyDown={::this.pressKey} label={'Name'} theme={{input: basicStyles.change_tag_name}}/>
                <ValueType valueType={valueType} changeValueType={::this.changeValueType}/>
                {this.renderValue()}
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