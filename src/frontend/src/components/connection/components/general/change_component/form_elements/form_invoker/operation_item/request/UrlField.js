

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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import Input from "@basic_components/inputs/Input";
import Select from "@basic_components/inputs/Select";
import CRequest, {METHOD_TYPES} from "@classes/components/content/invoker/request/CRequest";
import styles from '@themes/default/general/change_component.scss';
import Button from "@basic_components/buttons/Button";
import Loading from "@loading";


/**
 * Component for UrlField in Invoker.ResponseItem
 */
class UrlField extends Component{

    constructor(props){
        super(props);
        this.state = {
            endpoint: props.request.endpoint,
        };
    }

    changeUrl(){
        let {request} = this.props;
        request.endpoint = this.state.endpoint;
        this.props.update();
    }

    updateUrl(endpoint){
        this.setState({endpoint});
    }

    changeMethod(method){
        let {request} = this.props;
        request.method = method;
        this.props.update();
    }

    render(){
        const {endpoint} = this.state;
        const {request, sendRequest, isLoading} = this.props;
        return (
            <div className={styles.url_field}>
                <div className={styles.method}>
                    <Select
                        id={'input_method'}
                        name={'input_method'}
                        value={request.getMethodForSelect()}
                        onChange={(a) => this.changeMethod(a)}
                        options={METHOD_TYPES}
                        closeOnSelect={false}
                    />
                </div>
                <div className={styles.url}>
                    <Input
                        onChange={(a) => this.updateUrl(a)}
                        onBlur={(a) => this.changeUrl(a)}
                        name={'input_url'}
                        id={'input_url'}
                        placeholder={'Url'}
                        type={'text'}
                        maxLength={2048}
                        value={endpoint}
                        theme={{input: styles.input}}
                    />
                </div>
                <div className={styles.action}>
                    {
                        isLoading
                        ?
                            <Loading className={styles.connection_request_button_loading}/>
                        :
                            <Button
                                className={styles.send_button}
                                title={'Send'}
                                onClick={sendRequest}
                            />
                    }
                </div>
            </div>
        );
    }
}

UrlField.propTypes = {
    request: PropTypes.instanceOf(CRequest).isRequired,
    update: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
};

UrlField.defaultProps = {
    isLoading: false,
};

export default UrlField;