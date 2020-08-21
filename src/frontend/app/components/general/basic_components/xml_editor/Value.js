import React from 'react';
import PropTypes from 'prop-types';
import Input from "@basic_components/inputs/Input";
import {checkReferenceFormat} from "@utils/app";
import Reference from "@basic_components/xml_editor/Reference";
import ReferenceValues from "@basic_components/xml_editor/ReferenceValues";
import ValueType from "@basic_components/xml_editor/ValueType";
import theme from "react-toolbox/lib/input/theme.css";
import styles from "@themes/default/general/form_methods";

class Value extends React.Component{
    constructor(props) {
        super(props);
        let hasReferences = checkReferenceFormat(props.value);
        this.state = {
            valueType: hasReferences ? 'reference' : 'text',
            references: hasReferences ? props.value : '',
            notReferenceValue: hasReferences ? '' : props.value,
        };
    }

    changeNotReferenceValue(notReferenceValue){
        this.setState({notReferenceValue}, this.props.changeValue(notReferenceValue, false));
    }

    changeValueType(valueType){
        this.setState({valueType});
    }

    updateReferences(references){
        const {changeValue} = this.props;
        changeValue(references, true);
        this.setState({
            references,
        });
    }

    change(){
        const {references} = this.state;
        const {ReferenceComponent, changeValue} = this.props;
        let referenceDiv = document.getElementById(ReferenceComponent.id);
        let newReferences = references;
        if (checkReferenceFormat(referenceDiv.innerText)) {
            newReferences = references ? `${references};${referenceDiv.innerText}` : referenceDiv.innerText;
            changeValue(newReferences, true);
            referenceDiv.innerText = '';
            this.setState({
                references: newReferences,
            });
        }
    }

    renderValue(){
        const {valueType, references, notReferenceValue} = this.state;
        const {uniqueIndex, ReferenceComponent, pressKey, label} = this.props;
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
            <Input id={`${uniqueIndex}_value`} value={notReferenceValue} onChange={::this.changeNotReferenceValue} onKeyDown={pressKey} label={label}/>
        );
    }

    render(){
        const {valueType} = this.state;
        const {ReferenceComponent} = this.props;
        return (
            <React.Fragment>
                {ReferenceComponent && <ValueType valueType={valueType} changeValueType={::this.changeValueType}/>}
                {this.renderValue()}
            </React.Fragment>
        )
    }
}

Value.propTypes = {
    value: PropTypes.string.isRequired,
    changeValue: PropTypes.func.isRequired,
    uniqueIndex: PropTypes.string.isRequired,
};

Value.defaultProps = {
    pressKey: null,
    label: 'Value',
    ReferenceComponent: null,
};

export default Value;