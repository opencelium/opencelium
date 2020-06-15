import React, {Component} from 'react';
import Input from '@basic_components/inputs/Input';

import styles from '@themes/default/general/change_component.scss';


class HeaderValue extends Component{
    constructor(props){
        super(props);

        this.state = {
            headerKey: props.item.value
        };
    }

    onChange(value){
        this.setState({headerKey: value});
    }

    onBlur(e, key, type){
        const {headerKey} = this.state;
        const {onBlur, onChange} = this.props;
        onBlur();
        onChange(headerKey, key, type);
    }

    render(){
        const {headerKey} = this.state;
        const {item, readOnly, onFocus, forConnection} = this.props;
        return(
            <Input
                name={`input_header_${item.name}`}
                value={headerKey}
                onChange={::this.onChange}
                onFocus={onFocus}
                onBlur={(e) => ::this.onBlur(e, item.name, 'value')}
                label={forConnection ? '' : 'Value'}
                type={'text'}
                maxLength={forConnection ? 0 : 255}
                readOnly={readOnly}
                className={styles.invoker_item_val}
                theme={{
                    label: forConnection ? styles.form_input_label_for_connection : styles.form_input_label,
                    input: forConnection ? styles.form_input_input_header_for_connection : '',
                    inputElement: forConnection ? styles.form_input_header_element_for_connection : '',
                }}
            />
        );
    }
}

export default HeaderValue;