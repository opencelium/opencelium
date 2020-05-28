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
import {history} from '@components/App';

import styles from '@themes/default/general/content.scss';
import {getThemeClass} from "@utils/app";
import HelpIcon from "../app/HelpIcon";


/**
 * Header Component for Content
 */
class ContentHeader extends Component{

    constructor(props){
        super(props);
    }

    onClickBreadcrumb(e, breadcrumb){
        history.push(breadcrumb.link);
    }

    renderBreadcrumbs(){
        let {authUser, header} = this.props;
        let classNames = ['content_header_breadcrumb'];
        classNames = getThemeClass({classNames, authUser, styles});
        if(header.hasOwnProperty('breadcrumbs')){
            return header.breadcrumbs.map((b, key) => {
                return (
                    <div key={key} className={`${styles[classNames.content_header_breadcrumb]}`} onClick={(e) => ::this.onClickBreadcrumb(e, b)}>
                        <span>{b.text}</span>{` / `}
                    </div>
                );
            });
        }
        return null;
    }

    render(){
        const {authUser} = this.props;
        let {header} = this.props;
        let title = header;
        let hasHelp = false;
        if(header.hasOwnProperty('title')){
            if(header.hasOwnProperty('onHelpClick') && header.onHelpClick){
                hasHelp = true;
            }
            title = header.title;
        }
        let classNames = ['header'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={`${styles[classNames.header]}`}>
                {this.renderBreadcrumbs()}
                {title}
                {
                    hasHelp
                        ?
                            <HelpIcon onClick={header.onHelpClick} id={title}/>
                        :
                            null
                }
            </div>
        );
    }
}

ContentHeader.propTypes = {
    authUser: PropTypes.object.isRequired,
};

export default ContentHeader;