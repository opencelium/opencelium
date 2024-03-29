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
import styles from "@entity/connection/components/themes/default/content/connections/connection_overview_2";
import {components} from "react-select";
import FontIcon from "@entity/connection/components/components/general/basic_components/FontIcon";
import OCSelect from "@entity/connection/components/components/general/basic_components/inputs/Select";
import {setFocusById} from "@application/utils/utils";
import {Col} from "react-grid-system";
import {
    ApplyIcon,
    CancelIcon,
    EditIcon
} from "@change_component/form_elements/form_connection/form_svg/details/description/Icons";
import Confirmation from "@entity/connection/components/components/general/app/Confirmation";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

const IndicatorsContainer = props => {
    return (
        <components.IndicatorsContainer {...props}>
            <FontIcon value={'arrow_drop_down'} size={14} iconStyles={{verticalAlign: 'text-bottom'}}/>
        </components.IndicatorsContainer>
    );
};


class SelectableInput extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isMouseOver: false,
            isEditOn: false,
            optionValue: null,
            isConfirmationShown: false,
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
        const {id} = this.props;
        this.setState({
            isEditOn: !this.state.isEditOn,
        }, () => {
            if(this.state.isEditOn){
                setFocusById(id);
            }
        });
    }

    toggleConfirmation(){
        this.setState({
            isConfirmationShown: !this.state.isConfirmationShown,
        });
    }

    setOptionValue(optionValue){
        this.setState({optionValue});
    }

    cancelEdit(){
        this.setState({
            isEditOn: false,
            optionValue: null,
            isConfirmationShown: false,
            isMouseOver: false,
        });
    }

    changeValue(){
        const {optionValue} = this.state;
        const {changeValue} = this.props;
        changeValue(optionValue);
        this.setState({
            isEditOn: false,
            optionValue: null,
            isConfirmationShown: false,
            isMouseOver: false,
        });
    }

    renderOptions(){
        const {optionValue} = this.state;
        const {id, value, options} = this.props;
        return(
            <OCSelect
                id={id}
                value={optionValue}
                placeholder={value}
                onChange={(a) => this.setOptionValue(a)}
                options={options}
                className={styles.options}
                components={{IndicatorsContainer}}
                closeOnSelect={false}
                maxMenuHeight={200}
                minMenuHeight={50}
                styles={{
                    placeholder:(provided) => ({
                        ...provided,
                        top: '80%',
                    }),
                    singleValue:(provided) => ({
                        ...provided,
                        top: '80%',
                    }),
                    indicatorContainer:(provided) => ({
                        ...provided,
                        padding: '0 !important',
                        alignItems: 'center'
                    }),
                    indicatorSeparator:(provided) => ({
                        ...provided,
                        margin: '4px 0',
                    }),
                    dropdownIndicator:(provided) => ({
                        ...provided,
                        width: '12px',
                        height: '12px',
                    }),
                }}
                selectMenuStyles={{
                    left: '-75px',
                }}
                selectMenuControlStyles={{
                    minHeight: '14px',
                }}
                selectMenuValueContainer={{
                    height: '18px'
                }}
            />
        );
    }

    render(){
        const {isMouseOver, isEditOn, isConfirmationShown} = this.state;
        const {label, value, readOnly, onTextValueClick} = this.props;
        const hasOnTextValueClick = !!onTextValueClick;
        return(
            <React.Fragment>
                <Col id={label} xs={4} className={styles.col}>{label}</Col>
                <Col id={`${label}_option`} xs={8} className={isEditOn ? styles.col_select : styles.col} onMouseOver={(a) => this.mouseOver(a)} onMouseLeave={(a) => this.mouseLeave(a)}>
                    {isEditOn
                        ?
                        this.renderOptions()
                        :
                        <span
                            className={styles.value}
                            style={hasOnTextValueClick ? {cursor: 'pointer'} : {}}
                            onClick={hasOnTextValueClick ? () => onTextValueClick() : () => {}}>
                            {hasOnTextValueClick ? <TooltipFontIcon size={14} value={<span className={styles.open_aggregator}>{value}</span>} tooltip={'Show'}/> : value}
                        </span>}
                    {isMouseOver && !isEditOn && !readOnly && <EditIcon onClick={(a) => this.toggleEdit(a)}/>}
                    {isEditOn && <ApplyIcon onClick={(a) => this.toggleConfirmation(a)}/>}
                    {isEditOn && <CancelIcon onClick={(a) => this.cancelEdit(a)}/>}
                    <Confirmation
                        okClick={(a) => this.changeValue(a)}
                        cancelClick={(a) => this.toggleConfirmation(a)}
                        active={isConfirmationShown}
                        title={'Confirmation'}
                        message={'Do you really want to update?'}
                    />
                </Col>
            </React.Fragment>
        );
    }
}

SelectableInput.defaultProps = {
    onTextValueClick: null,
}

export default SelectableInput;
