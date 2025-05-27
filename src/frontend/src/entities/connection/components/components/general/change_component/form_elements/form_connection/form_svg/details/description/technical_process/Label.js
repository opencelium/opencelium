/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {Col} from "react-grid-system";
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {setFocusById} from "@application/utils/utils";
import Input from "@entity/connection/components/components/general/basic_components/inputs/Input";
import {
    ApplyIcon,
    CancelIcon,
    EditIcon
} from "@change_component/form_elements/form_connection/form_svg/details/description/Icons";
import Validation from "@application/classes/Validation";
import InputText from "@app_component/base/input/text/InputText";


@connect(null, {}, null, {forwardRef: true})
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
        console.log(readOnly)
        return(
            <React.Fragment>
                <Col id={text} xs={4} className={styles.col}>{text}</Col>
                <Col id={`${text}_option`} style={{display: 'flex'}} xs={8} className={styles.col} onMouseOver={(a) => this.mouseOver(a)} onMouseLeave={(a) => this.mouseLeave(a)}>
                    {isEditOn
                    ?
                        <InputText id={'details_label'} minHeight={'37px'} className={styles.details_label} maxLength={Validation.TextLength.Short} placeholder={label} value={labelValue} onChange={(e) => this.setLabelValue(e.target.value)} style={{padding: '0 !important'}}/>
                    :
                        <span className={styles.value}>{label === '' ? 'is empty' : label}</span>
                    }
                    {isMouseOver && !isEditOn && !readOnly && <EditIcon onClick={(a) => this.toggleEdit(a)}/>}
                    {isEditOn && <ApplyIcon onClick={(a) => this.changeLabel(a)}/>}
                    {isEditOn && <CancelIcon onClick={(a) => this.cancelEdit(a)}/>}
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
