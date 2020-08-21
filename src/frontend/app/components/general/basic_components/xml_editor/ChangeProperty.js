import React from 'react';
import PropTypes from 'prop-types';
import Input from "@basic_components/inputs/Input";
import Button from "@basic_components/buttons/Button";
import CProperty from "@classes/components/general/basic_components/xml_editor/CProperty";
import {findTopLeft, isNumber, setFocusById} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import ReactDOM from "react-dom";
import basicStyles from "@themes/default/general/basic_components";
import Value from "@basic_components/xml_editor/Value";
import CXml from "@classes/components/content/xml/CXml";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";

class ChangeProperty extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            name: props.property.name,
            value: props.property.value,
            isReference: props.property.isReference,
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

    changeValue(value, isReference){
        this.setState({
            value,
            isReference: value !== '' ? isReference : false,
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

    change(doClose = true){
        const {name, value, references, isReference} = this.state;
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
        let prevValue = property.value;
        property.isReference = isReference;
        property.update(name, value);
        if(ReferenceComponent){
            let referenceDiv = document.getElementById(ReferenceComponent.id);
            referenceDiv.innerText = '';
        }
        switch(mode){
            case 'add':
                change(property);
                break;
            case 'update':
                change();
                break;
        }
        CXmlEditor.setLastEditElement(property, value, prevValue, mode);
        if(doClose) {
            close();
        } else{
            this.setState({
                references: newReferences,
            });
        }
    }

    render(){
        const {name, value} = this.state;
        const {property, mode, close, ReferenceComponent} = this.props;
        return ReactDOM.createPortal(
            <div className={basicStyles.change_popup} style={{top: this.top, left: this.left}}>
                <TooltipFontIcon tooltip={'Close'} value={'close'} className={basicStyles.close_icon} onClick={close}/>
                <Input id={`${property.uniqueIndex}_name`} value={name} onChange={::this.changeName} onKeyDown={::this.pressKey} label={'Name'} theme={{input: basicStyles.change_tag_name}}/>
                <Value value={value} changeValue={::this.changeValue} uniqueIndex={property.uniqueIndex} ReferenceComponent={ReferenceComponent} pressKey={::this.pressKey}/>
                <Button onClick={::this.change} title={mode === 'add' ? 'Add' : 'Update'}/>
            </div>,
            document.getElementById('oc_xml_modal')
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