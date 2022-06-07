 /*
 *  Copyright (C) <2022>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import {connect} from 'react-redux';

import styles from '@entity/connection/components/themes/default/general/content.scss';
import {getThemeClass} from "@application/utils/utils";
import HelpIcon from "../app/HelpIcon";



function mapStateToProps(state){
    const authUser = state.authReducer.authUser;
    return {
        authUser,
    };
}
/**
 * Header Component for Content
 */
@connect(mapStateToProps, {})
class ContentHeader extends Component{

    constructor(props){
        super(props);
    }

    onClickBreadcrumb(e, breadcrumb){
    }

    renderBreadcrumbs(){
        let {authUser, header} = this.props;
        let classNames = ['content_header_breadcrumb', 'title'];
        classNames = getThemeClass({classNames, authUser, styles});
        if(header.hasOwnProperty('breadcrumbs')){
            return header.breadcrumbs.map((b, key) => {
                return (
                    <div key={key} className={`${styles[classNames.content_header_breadcrumb]}`}>
                        <button className={styles[classNames.title]} onClick={(e) => this.onClickBreadcrumb(e, b)}>{b.text}</button>{` / `}
                    </div>
                );
            });
        }
        return null;
    }

    render(){
        const {authUser, icons} = this.props;
        let {header, className} = this.props;
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
            <div className={`${styles[classNames.header]} ${className}`}>
                {this.renderBreadcrumbs()}
                {title}
                {
                    hasHelp
                        ?
                            <HelpIcon onClick={header.onHelpClick} id={title}/>
                        :
                            null
                }
                <sup>
                    {
                        icons.map((Icon, key) => <React.Fragment key={key}>{Icon}</React.Fragment>)
                    }
                </sup>
            </div>
        );
    }
}

ContentHeader.defaultProps = {
    className: '',
    icons: [],
}

export default ContentHeader;