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

import styles from '../../../themes/default/general/app.scss';
import {connect} from "react-redux";
import {getThemeClass} from "../../../utils/app";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}


/**
 * Component for Page not Found
 */
@connect(mapStateToProps, {})
class PageNotFound extends Component{

    constructor(props){
        super(props);
    }
    
    render(){
        const {authUser} = this.props;
        let classNames = ['page_not_found', 'page_not_found_smile'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Container>
                <Row>
                    <Col md={6} offset={{ md: 3 }}>
                        <div className={styles[classNames.page_not_found]}>
                            This Page not Found
                        </div>
                        <div className={styles[classNames.page_not_found_smile]}>
                            <img src="../../../../img/page_not_found.png" width={72} height={72} />
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default PageNotFound;