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
import {withTranslation} from 'react-i18next';
import { Row, Col } from "react-grid-system";

import styles from '../../../../themes/default/content/connectors/view.scss';
import {getThemeClass} from "../../../../utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Operations of the Invoker
 */
@connect(mapStateToProps, {})
@withTranslation('connectors')
class Operations extends Component{
    constructor(props){
        super(props);
    }

    renderOperations(){
        let {connector} = this.props;
        let invoker = connector && connector.hasOwnProperty('invoker') ? connector.invoker : null;
        if(invoker){
            let operations = invoker.hasOwnProperty('operations') ? invoker.operations : [];
            if(Array.isArray(operations)) {
                return operations.map((operation, key) => {
                    return (
                        <Row key={key}>
                            <Col md={12}>{operation.name}</Col>
                        </Row>
                    );
                });
            }
        }
        return (
            <Row key={key}>
                <Col md={12}>{'Operations are absent'}</Col>
            </Row>
        );
    }

    render(){
        const {authUser, t} = this.props;
        let classNames = ['operations', 'content', 'operation_header'];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <Row className={styles[classNames.operations]}>
                <Col md={12}>
                    <div className={styles[classNames.content]}>
                        <Row>
                            <Col md={12} className={styles[classNames.operation_header]}>{`${t('VIEW.OPERATIONS_TITLE')}`}</Col>
                        </Row>
                        {this.renderOperations()}
                    </div>
                </Col>
            </Row>
        );
    }
}

Operations.propTypes = {
    connector: PropTypes.object.isRequired,
};

export default Operations;