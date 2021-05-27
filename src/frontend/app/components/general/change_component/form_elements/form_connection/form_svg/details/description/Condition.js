import React from 'react';
import {connect} from 'react-redux';
import {Col, Row} from "react-grid-system";
import styles from "@themes/default/content/connections/connection_overview_2";
import {isString, setFocusById} from "@utils/app";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Input from "@basic_components/inputs/Input";
import {setCurrentTechnicalItem} from "@actions/connection_overview_2/set";
import Dialog from "@basic_components/Dialog";
import {EditIcon} from "@change_component/form_elements/form_connection/form_svg/details/description/Icons";


@connect(null, {setCurrentTechnicalItem})
class Condition extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isMouseOver: false,
            isOpenEditDialog: false,
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
            isOpenEditDialog: !this.state.isOpenEditDialog,
        }, () => {
            if(this.state.isOpenEditDialog){
                setFocusById('details_condition');
            }
        });
    }

    updateCondition(){
        this.toggleEdit();
        this.setState({
            isMouseOver: false,
        })
    }

    render(){
        const {isMouseOver, isOpenEditDialog} = this.state;
        const {details} = this.props;
        const operatorItem = details.entity;
        const conditionText = operatorItem.condition.generateStatementText();
        return(
            <React.Fragment>
                <Col xs={4} className={styles.col}>{`Condition`}</Col>
                <Col xs={8} className={styles.col} onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                    <span className={styles.value}>{conditionText}</span>
                    {isMouseOver && !isOpenEditDialog && <EditIcon onClick={::this.toggleEdit}/>}
                    <Dialog
                        actions={[{label: 'Apply', onClick: ::this.updateCondition, id: 'condition_apply'}]}
                        active={isOpenEditDialog}
                        toggle={::this.toggleEdit}
                        title={'Condition'}
                        theme={{dialog: styles.condition_dialog}}
                    >
                        Condition
                    </Dialog>
                </Col>
            </React.Fragment>
        );
    }
}

export default Condition;