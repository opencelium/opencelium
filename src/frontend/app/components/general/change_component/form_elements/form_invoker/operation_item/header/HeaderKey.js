import React, {Component} from 'react';
import PropTypes from 'prop-types';
import FormSelect from "../../../FormSelect";

import styles from '../../../../../../../themes/default/general/change_component.scss';
import Input from "../../../../../basic_components/inputs/Input";


class HeaderKey extends Component{

    constructor(props){
        super(props);
    }

    renderReadonlyHeaderKey(){
        const {forConnection, item, itemValue, onFocusValue, onBlurValue} = this.props;
        return(
            <Input
                name={`select_header_${item.name}`}
                value={itemValue.value}
                onFocus={onFocusValue}
                onBlur={onBlurValue}
                label={forConnection ? '' : 'Key'}
                type={'text'}
                maxLength={forConnection ? 0 : 255}
                readOnly={true}
                className={forConnection ? styles.invoker_item_prop_for_connection : styles.invoker_item_prop}
                theme={{
                    label: forConnection ? styles.form_input_label_for_connection : styles.form_input_label,
                    input: forConnection ? styles.form_input_input_header_for_connection : '',
                    inputElement: forConnection ? styles.form_input_header_element_for_connection : '',
                }}
            />
        );
    }

    render(){
        const {forConnection, itemSource, item, itemValue, isReadonly, handleChange, onFocusValue, onBlurValue} = this.props;
        let propertyLabel = 'Key';
        if(isReadonly || forConnection){
            return this.renderReadonlyHeaderKey();
        }
        return(
            <FormSelect
                data={{
                    icon: forConnection ? '' : 'bookmark',
                    selectClassName: styles.invoker_item_prop,
                    source: itemSource,
                    name: `select_header_${item.name}`,
                    placeholder: propertyLabel,
                    label: propertyLabel,
                    visible: true
                }}
                value={itemValue}
                handleChange={(e) => handleChange(e, item.name, 'name')}
                entity={{}}
                onFocus={onFocusValue}
                onBlur={onBlurValue}
                isDisabled={isReadonly}
            />
        );
    }
}

HeaderKey.propTypes = {
    forConnection: PropTypes.bool,
    itemSource: PropTypes.array.isRequired,
    item: PropTypes.object.isRequired,
    itemValue: PropTypes.object.isRequired,
    isReadonly: PropTypes.bool,
    handleChange: PropTypes.func.isRequired,
    onFocusValue: PropTypes.func.isRequired,
    onBlurValue: PropTypes.func.isRequired,
};

HeaderKey.defaultProps = {
    forConnection: false,
    isReadonly: false,
};

export default HeaderKey;