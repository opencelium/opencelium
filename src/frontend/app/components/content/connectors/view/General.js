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
 * General information about Connector
 */
@connect(mapStateToProps, {})
@withTranslation('connectors')
class General extends Component{
    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t, connector} = this.props;
        let classNames = ['general', 'header', 'title', 'description'];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <Row className={styles[classNames.general]}>
                <Col md={12}>
                    <div className={styles[classNames.header]}>{`${t('VIEW.GENERAL_TITLE')}`}</div>
                    <div className={styles[classNames.title]}>{connector.name}</div>
                    <div className={styles[classNames.description]}>{connector.description}</div>
                </Col>
            </Row>
        );
    }
}

General.propTypes = {
    connector: PropTypes.object.isRequired,
};

export default General;