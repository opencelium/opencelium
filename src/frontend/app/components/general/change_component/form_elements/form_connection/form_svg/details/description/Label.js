import React from 'react';
import {connect} from 'react-redux';
import {Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import {isString, setFocusById} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Input from "@basic_components/inputs/Input";
import {setCurrentTechnicalItem} from "@actions/connection_overview_2/set";


@connect(null, {setCurrentTechnicalItem})
class Label extends React.Component{
    constructor(props) {
        super(props);

        const labelValue = props.details && isString(props.details.label) ? props.details.label : '';

        this.state = {
            isMouseOver: false,
            isEditOn: false,
            labelValue,
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
                setFocusById('details_label');
            }
        });
    }

    setLabelValue(labelValue){
        this.setState({
            labelValue,
        });
    }

    changeLabel(){
        const {labelValue} = this.state;
        const {connection, details, updateConnection, setCurrentTechnicalItem} = this.props;
        const connector = connection.getConnectorByMethodIndex(details.entity);
        const method = connector.getMethodByColor(details.entity.color);
        method.label = labelValue;
        const currentItem = connector.getSvgElementByIndex(method.index);
        updateConnection(connection);
        setCurrentTechnicalItem(currentItem);
        this.setState({
            isEditOn: false,
            labelValue: '',
        })
    }

    render(){
        const {isMouseOver, isEditOn, labelValue} = this.state;
        const {details} = this.props;
        const methodLabel = details.entity.label;
        return(
            <React.Fragment>
                <Col xs={4} className={styles.col}>{`Label`}</Col>
                <Col xs={8} className={styles.col} onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                    {isEditOn
                    ?
                        <Input id={'details_label'} placeholder={methodLabel} value={labelValue} onChange={::this.setLabelValue} theme={{input: styles.label_input, inputElement: styles.label_input_element}}/>
                    :
                        <span>{methodLabel === '' ? 'is empty' : methodLabel}</span>
                    }
                    {isMouseOver && !isEditOn && <TooltipFontIcon className={styles.edit_icon} size={14} isButton={true} tooltip={'Edit'} value={'edit'} onClick={::this.toggleEdit}/>}
                    {isEditOn && <TooltipFontIcon className={styles.edit_icon} size={14} isButton={true} tooltip={'Apply'} value={'check'} onClick={::this.changeLabel}/>}
                </Col>
            </React.Fragment>
        );
    }
}

export default Label;