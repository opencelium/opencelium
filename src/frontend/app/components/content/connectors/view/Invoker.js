/*
 * Copyright (C) <2021>  <becon GmbH>
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

import styles from '@themes/default/content/connectors/view.scss';
import ConnectorIcon from "../../../icons/ConnectorIcon";
import {getThemeClass} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Information about Invoker
 */
@connect(mapStateToProps, {})
@withTranslation('connectors')
class Invoker extends Component{
    constructor(props){
        super(props);
    }

    render(){
        const {connector, authUser, t} = this.props;
        let invoker = connector && connector.hasOwnProperty('invoker') ? connector.invoker : null;
        if(!invoker){
            return null;
        }
        let icon = invoker.hasOwnProperty('icon') ? invoker.icon : '';
        let name = invoker.hasOwnProperty('name') ? invoker.name : 'Name is absent for this invoker';
        let description = invoker.hasOwnProperty('description') ? invoker.description : 'Description is absent for this invoker';
        let classNames = ['invoker', 'header', 'name', 'description'];
        classNames = getThemeClass({classNames, authUser, styles});
        return(
            <Row className={styles[classNames.invoker]}>
                <Col md={12}>
                    <div className={styles[classNames.header]}>{`${t('VIEW.INVOKER_TITLE')}`}</div>
                    <Row>
                        <Col md={2}>
                            <ConnectorIcon icon={icon}/>
                        </Col>
                        <Col md={10}>
                            <div className={styles[classNames.name]}>{name}</div>
                            <div className={styles[classNames.description]}>{description}</div>
                        </Col>
                    </Row>
                </Col>
            </Row>
        );
    }
}

Invoker.propTypes = {
    connector: PropTypes.object.isRequired,
};

export default Invoker;