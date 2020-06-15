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
import { Container, Row, Col } from "react-grid-system";
import ViewHeader from '../view_component/Header';
import ListButton from "../view_component/ListButton";

import styles from '@themes/default/general/view_component.scss';
import UpdateButton from "../list_of_components/UpdateButton";
import {getThemeClass} from "@utils/app";
import EmptyButton from "../view_component/EmptyButton";


/**
 * Content Component
 */
class Content extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        setTimeout(function(){
            const app_content = document.getElementById("app_content");
            if(app_content !== null) {
                app_content.style.opacity = 1;
            }
        }, 500);
    }

    renderNavigationButton(){
        const {getListLink, getUpdateLink, translations, permissions, authUser} = this.props;
        if(translations.hasOwnProperty('list_button')){
            return <ListButton
                title={translations.list_button}
                link={getListLink}
                permission={permissions.READ}
                authUser={authUser}
            />;
        } else if(translations.hasOwnProperty('update_button')){
            return <UpdateButton
                title={translations.update_button}
                link={getUpdateLink}
                permission={permissions.UPDATE}
                authUser={authUser}
            />;
        } else{
            if(permissions && permissions.hasOwnProperty('READ')) {
                return <EmptyButton
                    authUser={authUser}
                    permission={permissions.READ}
                />;
            } else{
                return null;
            }
        }
    }

    render(){
        const {translations, style, contentStyle, authUser, contentColClass} = this.props;
        let classNames = ['content'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Row style={style} id={'app_content'}>
                <Col xl={10} lg={10} md={12} sm={12} offset={{ xl: 1, lg: 1 }} >
                    <Container sm>
                        <ViewHeader header={translations.header} authUser={authUser}/>
                        <Row style={{...contentStyle, marginLeft: 0, marginRight: 0}}>
                            <Col md={12} className={`${contentColClass} ${styles[classNames.content]}`}>
                                {this.props.children}
                            </Col>
                        </Row>
                        {this.renderNavigationButton()}
                    </Container>
                </Col>
            </Row>
        );
    }
}

Content.propTypes = {
    authUser: PropTypes.object.isRequired,
    getListLink: PropTypes.string,
    getUpdateLink: PropTypes.string,
    translations: PropTypes.object,
};

Content.defaultProps = {
    contentStyle: {},
    contentColClass: '',
};

export default Content;