import React from 'react';
import {connect} from 'react-redux';
import {Col} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import {isString, setFocusById} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Input from "@basic_components/inputs/Input";
import {setCurrentTechnicalItem} from "@actions/connection_overview_2/set";
import {
    ApplyIcon,
    CancelIcon,
    EditIcon
} from "@change_component/form_elements/form_connection/form_svg/details/description/Icons";


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
        const connector = connection.getConnectorByType(details.connectorType);
        const method = connector.getMethodByColor(details.entity.color);
        method.label = labelValue;
        const currentItem = connector.getSvgElementByIndex(method.index);
        updateConnection(connection);
        setCurrentTechnicalItem(currentItem);
        this.setState({
            isEditOn: false,
            isMouseOver: false,
        })
    }

    cancelEdit(){
        this.setState({
            isMouseOver: false,
            isEditOn: false,
        });
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
                        <span className={styles.value}>{methodLabel === '' ? 'is empty' : methodLabel}</span>
                    }
                    {isMouseOver && !isEditOn && <EditIcon onClick={::this.toggleEdit}/>}
                    {isEditOn && <ApplyIcon onClick={::this.changeLabel}/>}
                    {isEditOn && <CancelIcon onClick={::this.cancelEdit}/>}
                </Col>
            </React.Fragment>
        );
    }
}

export default Label;