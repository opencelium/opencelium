import React from 'react';
import Button from "@basic_components/buttons/Button";
import styles from '@themes/default/general/change_component.scss';

class TestButton extends React.Component{
    constructor(props) {
        super(props);
    }

    test(){
        this.props.data.test(this.props.entity);
    }

    render(){
        const {disabled} = this.props.data;
        let iconClassName = '';
        if(disabled){
            iconClassName = styles.test_button_loading;
        }
        return(
            <Button
                iconClassName={iconClassName}
                className={styles.test_button}
                title={<span>{'Test'}</span>}
                icon={disabled ? 'loading' : 'donut_large'}
                disabled={disabled}
                onClick={::this.test}
            />
        );
    }
}

export default TestButton;