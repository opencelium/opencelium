import React from 'react';
import {connect} from 'react-redux';
import {Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import {isString, setFocusById} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Select from "@basic_components/inputs/Select";
import {setCurrentTechnicalItem} from "@actions/connection_overview_2/set";


@connect(null, {setCurrentTechnicalItem})
class Name extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isMouseOver: false,
            isEditOn: false,
            optionValue: null,
        }
    }

    mouseOver(){
        this.setState({
            isMouseOver: true,
        });
    }

    mouseLeave(){
        this.setState({
            isMouseOver: false,
        });
    }

    toggleEdit(){
        this.setState({
            isEditOn: !this.state.isEditOn,
        }, () => {
            if(this.state.isEditOn){
                setFocusById('name_options');
            }
        });
    }

    setOptionValue(optionValue){
        this.setState({optionValue});
    }

    changeName(){
        const {optionValue} = this.state;
        const {details, connection, updateConnection, setCurrentTechnicalItem} = this.props;
        let connector;
        let isFromConnector = false;
        if(connection.fromConnector.invoker.name === details.entity.invoker.name){
            connector = connection.fromConnector;
            isFromConnector = true;
        } else{
            connector = connection.toConnector;
        }
        let method = {index: details.entity.index};
        let operation = connector.invoker.operations.find(o => o.name === optionValue.value);
        method.name = optionValue.value;
        method.request = operation.request.getObject({bodyOnlyConvert: true});
        method.response = operation.response.getObject({bodyOnlyConvert: true});
        let currentItem;
        if(isFromConnector){
            connection.removeFromConnectorMethod(details.entity, false);
            connection.addFromConnectorMethod(method);
            currentItem = connection.fromConnector.getSvgElementByIndex(method.index);
        } else{
            connection.removeToConnectorMethod(details.entity, false);
            connection.addToConnectorMethod(method);
            currentItem = connection.toConnector.getSvgElementByIndex(method.index);
        }
        updateConnection(connection);
        setCurrentTechnicalItem(currentItem);
        this.setState({
            isEditOn: !this.state.isEditOn,
            optionValue: null,
        });
    }

    getName(){
        const {details} = this.props;
        let name = details && isString(details.name) ? details.name : '';
        if(name === '') name = 'is empty';
        return name;
    }

    renderOptions(){
        const {optionValue} = this.state;
        const invoker = this.props.details.entity.invoker;
        return(
            <Select
                id={`name_options`}
                className={styles.options}
                value={optionValue}
                placeholder={::this.getName()}
                onChange={::this.setOptionValue}
                options={invoker.getAllOperationsForSelect()}
                closeOnSelect={false}
                maxMenuHeight={200}
                minMenuHeight={50}
                selectMenuStyles={{
                    left: '-75px',
                }}
                selectMenuControlStyles={{
                    minHeight: '14px',
                }}
                selectMenuIndicatorSeparatorStyles={{
                    margin: '4px 0',
                }}
                selectMenuIndicatorContainerStyles={{
                    padding: '4px',
                }}
                selectMenuValueContainer={{
                    height: '18px'
                }}
                selectMenuDropdownIndicatorStyles={{
                    width: '12px',
                    height: '12px',
                }}
                selectMenuSingleValueStyles={{
                    top: '80%',
                }}
                selectMenuPlaceholderStyles={{
                    top: '80%',
                }}
            />
        );
    }

    render(){
        const {isMouseOver, isEditOn} = this.state;
        return(
            <React.Fragment>
                <Col xs={4} className={styles.col}>{`Name`}</Col>
                <Col xs={8} className={isEditOn ? styles.col_select : styles.col} onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                    {isEditOn ? ::this.renderOptions() : <span>{::this.getName()}</span>}
                    {isMouseOver && !isEditOn && <TooltipFontIcon className={styles.edit_icon} size={14} isButton={true} tooltip={'Edit'} value={'edit'} onClick={::this.toggleEdit}/>}
                    {isEditOn && <TooltipFontIcon className={styles.edit_icon} size={14} isButton={true} tooltip={'Apply'} value={'check'} onClick={::this.changeName}/>}
                </Col>
            </React.Fragment>
        );
    }
}

export default Name;