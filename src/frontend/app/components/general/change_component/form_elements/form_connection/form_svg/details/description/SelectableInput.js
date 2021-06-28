import React from 'react';
import styles from "@themes/default/content/connections/connection_overview_2";
import {components} from "react-select";
import FontIcon from "@basic_components/FontIcon";
import OCSelect from "@basic_components/inputs/Select";
import {setFocusById} from "@utils/app";
import {Col} from "react-grid-system";
import {
    ApplyIcon,
    CancelIcon,
    EditIcon
} from "@change_component/form_elements/form_connection/form_svg/details/description/Icons";
import Confirmation from "@components/general/app/Confirmation";

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
                onChange={::this.setOptionValue}
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
        const {label, value, readOnly} = this.props;
        return(
            <React.Fragment>
                <Col xs={4} className={styles.col}>{label}</Col>
                <Col xs={8} className={isEditOn ? styles.col_select : styles.col} onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                    {isEditOn ? ::this.renderOptions() : <span className={styles.value}>{value}</span>}
                    {isMouseOver && !isEditOn && !readOnly && <EditIcon onClick={::this.toggleEdit}/>}
                    {isEditOn && <ApplyIcon onClick={::this.toggleConfirmation}/>}
                    {isEditOn && <CancelIcon onClick={::this.cancelEdit}/>}
                    <Confirmation
                        okClick={::this.changeValue}
                        cancelClick={::this.toggleConfirmation}
                        active={isConfirmationShown}
                        title={'Confirmation'}
                        message={'Do you really want to update?'}
                    />
                </Col>
            </React.Fragment>
        );
    }
}

export default SelectableInput;