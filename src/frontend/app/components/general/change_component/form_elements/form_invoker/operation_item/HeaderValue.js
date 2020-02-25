import React, {Component} from 'react';
import Input from '../../../../basic_components/inputs/Input';

import styles from '../../../../../../themes/default/general/change_component.scss';


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
        const {item, readOnly, onFocus} = this.props;
        return(
            <Input
                name={`input_header_${item.name}`}
                value={headerKey}
                onChange={::this.onChange}
                onFocus={onFocus}
                onBlur={(e) => ::this.onBlur(e, item.name, 'value')}
                label={'Value'}
                type={'text'}
                maxLength={255}
                readOnly={readOnly}
                className={styles.invoker_item_val}
                theme={{label: styles.form_input_label}}
            />
        );
    }
}

export default HeaderValue;