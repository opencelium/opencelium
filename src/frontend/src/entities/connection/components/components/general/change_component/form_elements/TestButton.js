/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import styles from '@entity/connection/components/themes/default/general/change_component.scss';

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
                title={'Test'}
                icon={disabled ? 'loading' : 'donut_large'}
                disabled={disabled}
                onClick={() => this.test()}
            />
        );
    }
}

export default TestButton;