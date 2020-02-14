/*
 * Copyright (C) <2019>  <becon GmbH>
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
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import Content from "../../../general/content/Content";

import {fetchConnection} from '../../../../actions/connections/fetch';
import {ConnectionPermissions} from "../../../../utils/constants/permissions";
import {permission} from "../../../../decorators/permission";
import {SingleComponent} from "../../../../decorators/SingleComponent";
import ReactSVG from 'react-svg';
import styles from '../../../../themes/default/content/connections/graph.scss';
import {getThemeClass} from "../../../../utils/app";

import {GRAPH_TEMPLATE} from "../../../../templates/GraphTemplate";

const connectionPrefixURL = '/connections';

function mapStateToProps(state){
    const auth = state.get('auth');
    const connections = state.get('connections');
    return{
        authUser: auth.get('authUser'),
        error: connections.get('error'),
        connection: connections.get('connection'),
        fetchingConnection: connections.get('fetchingConnection'),
    };
}


/**
 * Component for Connection Graph
 */
@connect(mapStateToProps, {fetchConnection})
@permission(ConnectionPermissions.READ, true)
@withTranslation(['connections', 'app'])
@SingleComponent('connection')
class ConnectionGraph extends Component{

    constructor(props){
        super(props);
        this.draggable = false;
        this.state = {
            rendered: false
        };
    }

    /**
     * to make graph draggable
     */
    makeDraggable(){
        if(this.state.rendered && !this.draggable) {
            this.draggable = true;
            dragElement(document.getElementById("graph"));

            function dragElement(element) {
                if (element === null) {
                    return;
                }
                let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
                element.onmousedown = dragMouseDown;

                function dragMouseDown(e) {
                    e = e || window.event;
                    e.preventDefault();
                    // get the mouse cursor position at startup:
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    document.onmouseup = closeDragElement;
                    // call a function whenever the cursor moves:
                    document.onmousemove = elementDrag;
                }

                function elementDrag(e) {
                    e = e || window.event;
                    e.preventDefault();
                    // calculate the new cursor position:
                    pos1 = pos3 - e.clientX;
                    pos2 = pos4 - e.clientY;
                    pos3 = e.clientX;
                    pos4 = e.clientY;
                    // set the element's new position:
                    element.style.top = (element.offsetTop - pos2) + "px";
                    element.style.left = (element.offsetLeft - pos1) + "px";
                }

                function closeDragElement() {
                    // stop moving when mouse button is released:
                    document.onmouseup = null;
                    document.onmousemove = null;
                }
            }
        }
    }

    render(){
        let {t, connection, authUser} = this.props;
        let contentTranslations = {};
        contentTranslations.header = t('GRAPH.HEADER');
        contentTranslations.list_button = {title: t('GRAPH.LIST_BUTTON'), index: 2};
        let changeContentTranslations = {};
        changeContentTranslations.addButton = t('GRAPH.READ_BUTTON');
        changeContentTranslations.testButton = t('GRAPH.TEST_BUTTON');
        let getListLink = `${connectionPrefixURL}`;
        connection.svg = GRAPH_TEMPLATE;
        if(!this.state.rendered) {
            this.setState({rendered: true}, ::this.makeDraggable);
        }
        let classNames = ['content_col'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Content
                translations={contentTranslations}
                getListLink={getListLink}
                permissions={ConnectionPermissions}
                authUser={authUser}
                contentColClass={styles[classNames.content_col]}
            >
                <div
                    id={'graph'}
                    style={{overflow: 'hidden', position: 'absolute', cursor: 'move'}}>
                    <ReactSVG
                        src={'../../../../img/graph.svg'}
                    />
                </div>
            </Content>
        );
    }
}

export default ConnectionGraph;