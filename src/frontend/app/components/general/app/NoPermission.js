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

import React, { Component }  from 'react';
import {Col, Container, Row} from "react-grid-system";
import styles from '@themes/default/content/app/app.scss';

import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {getThemeClass} from "@utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}


/**
 * Component for No Permission
 */
@connect(mapStateToProps, {})
@withTranslation('app')
class NoPermission extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t} = this.props;
        let classNames = ['no_permission_image', 'no_permission_title'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Container>
                <Row>
                    <Col md={6} offset={{md: 3}}>
                        <img src='../../../../img/no_permission.png' className={styles[classNames.no_permission_image]}/>
                        <div className={styles[classNames.no_permission_title]}>{t('NO_PERMISSION.TITLE')}</div>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default NoPermission;