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
 * Hint of the Invoker
 */
@connect(mapStateToProps, {})
@withTranslation('connectors')
class Hint extends Component{
    constructor(props){
        super(props);
    }

    render(){
        const {authUser, t, connector} = this.props;
        if(connector) {
            let invoker = connector.hasOwnProperty('invoker') ? connector.invoker : null;
            if(invoker) {
                let hint = invoker.hasOwnProperty('hint') ? invoker.hint : 'No Hint for this connector';
                let classNames = ['hint', 'content', 'hint_header'];
                classNames = getThemeClass({classNames, authUser, styles});
                return (
                    <Row className={styles[classNames.hint]}>
                        <Col md={12}>
                            <div className={styles[classNames.content]}>
                                <Row>
                                    <Col md={12}
                                         className={styles[classNames.hint_header]}>{`${t('VIEW.HINT_TITLE')}`}</Col>
                                </Row>
                                <Row>
                                    <Col md={12}>{hint}</Col>
                                </Row>
                            </div>
                        </Col>
                    </Row>
                );
            }
        }
        return null;
    }
}

Hint.propTypes = {
    connector: PropTypes.object.isRequired,
};

export default Hint;