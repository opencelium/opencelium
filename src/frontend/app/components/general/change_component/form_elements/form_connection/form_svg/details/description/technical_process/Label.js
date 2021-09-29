import React from 'react';
import PropTypes from 'prop-types';
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

        this.state = {
            isMouseOver: false,
            isEditOn: false,
            labelValue: '',
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.label !== prevProps.label && this.state.labelValue !== prevState.labelValue){
            this.setState({
                isMouseOver: false,
                isEditOn: false,
            })
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
        let {labelValue} = this.state;
        const {changeLabel, label} = this.props;
        if(labelValue === '') {
            labelValue = label;
        }
        changeLabel(labelValue);
        this.setState({
            isEditOn: false,
            isMouseOver: false,
            labelValue: '',
        })
    }

    cancelEdit(){
        this.setState({
            isEditOn: false,
            isMouseOver: false,
        });
    }

    render(){
        const {isMouseOver, isEditOn, labelValue} = this.state;
        const {label, readOnly, text} = this.props;
        return(
            <React.Fragment>
                <Col xs={4} className={styles.col}>{text}</Col>
                <Col xs={8} className={styles.col} onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                    {isEditOn
                    ?
                        <Input id={'details_label'} placeholder={label} value={labelValue} onChange={::this.setLabelValue} theme={{input: styles.label_input, inputElement: styles.label_input_element}}/>
                    :
                        <span className={styles.value}>{label === '' ? 'is empty' : label}</span>
                    }
                    {isMouseOver && !isEditOn && !readOnly && <EditIcon onClick={::this.toggleEdit}/>}
                    {isEditOn && <ApplyIcon onClick={::this.changeLabel}/>}
                    {isEditOn && <CancelIcon onClick={::this.cancelEdit}/>}
                </Col>
            </React.Fragment>
        );
    }
}

Label.propTypes = {
    label: PropTypes.string.isRequired,
    changeLabel: PropTypes.func.isRequired,
};

export default Label;