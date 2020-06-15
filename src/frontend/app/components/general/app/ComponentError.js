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
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";

import styles from '@themes/default/general/app.scss';
import {ERROR_TYPE} from "@utils/constants/app";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Component to handle Error in a Card
 */
@connect(mapStateToProps, {})
@withTranslation('app')
class ComponentError extends Component{
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    componentDidMount(){
        if(window.hasOwnProperty('ATL_JQ_PAGE_PROPS')) {
            const {entity} = this.props;
            window.ATL_JQ_PAGE_PROPS.fieldValues.description = `Error Data: type: ${entity.type}; name: ${entity.name}` + '\n\nAdditional Information:';
        }
    }

    componentDidCatch(error, info) {
        const {entity} = this.props;
        if(window.hasOwnProperty('ATL_JQ_PAGE_PROPS')) {
            window.ATL_JQ_PAGE_PROPS.fieldValues.description = '\nAdditional Information:\n\n' + `Error Data: type: ${entity.type}; name: ${entity.name}; error: ${JSON.stringify(info)}` + '\n';
        }
        this.setState({ hasError: true, error, info });
    }

    renderMessage(){
        const {t, entity} = this.props;
        switch(entity.type){
            case ERROR_TYPE.FRONTEND:
                return (
                    <div>
                        {t(`ERROR.${entity.type}.MESSAGE`)}
                        <br/>
                        <br/>
                        <h3>
                            <div className={styles.support_action}>
                                <span id={'support_action'} about={`type: ${entity.type}; name: ${entity.name}`}>{t(`ERROR.LINK`)}</span>
                            </div>
                        </h3>
                    </div>
                );
            case ERROR_TYPE.BACKEND:
                return (
                    <div>
                        {t('REJECTED_REQUESTS.ERROR_FETCH_LIST', {entityName: entity.name})}
                        <br/>
                        <br/>
                        <h3>
                            <div className={styles.support_action}>
                                <span id={'support_action'}>{t(`ERROR.LINK`)}</span>
                            </div>
                        </h3>
                    </div>
                );
        }
        return null;
    }

    render() {
        if (this.state.hasError || this.props.manualVisible) {
            return (
                <h3 className={styles.entity_error_message}>
                    {this.renderMessage()}
                </h3>
            );
        }
        return this.props.children;
    }
}

ComponentError.propTypes = {
    entity: PropTypes.object.isRequired,
    manualVisible: PropTypes.bool,
};

ComponentError.defaultProps = {
    manualVisible: false,
};

export default ComponentError;