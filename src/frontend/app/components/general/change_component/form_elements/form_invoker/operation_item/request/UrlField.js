/*
 * Copyright (C) <2020>  <becon GmbH>
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
import OCSelect from "@basic_components/inputs/Select";
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
            query: props.request.query,
        };
    }

    changeUrl(){
        let {request} = this.props;
        request.query = this.state.query;
        this.props.update();
    }

    updateUrl(query){
        this.setState({query});
    }

    changeMethod(method){
        let {request} = this.props;
        request.method = method;
        this.props.update();
    }

    render(){
        const {query} = this.state;
        const {request, sendRequest, isLoading} = this.props;
        return (
            <div className={styles.url_field}>
                <div className={styles.method}>
                    <OCSelect
                        id={'input_method'}
                        name={'input_method'}
                        value={request.getMethodForSelect()}
                        onChange={::this.changeMethod}
                        options={METHOD_TYPES}
                        closeOnSelect={false}
                    />
                </div>
                <div className={styles.url}>
                    <Input
                        onChange={::this.updateUrl}
                        onBlur={::this.changeUrl}
                        name={'input_url'}
                        id={'input_url'}
                        placeholder={'Url'}
                        type={'text'}
                        maxLength={2048}
                        value={query}
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
                                icon={'send'}
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