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
import { withRouter } from 'react-router';
import Pagination from 'react-bootstrap/Pagination';
import {addNextPageKeyNavigation, removeNextPageKeyNavigation} from '@utils/key_navigation';
import styles from '@themes/default/general/pagination.scss';
import FontIcon from "../FontIcon";


/**
 * Component for Next Page
 */
class NextPage extends Component{

    constructor(props){
        super(props);

        this.openNextPage = this.openNextPage.bind(this);
    }

    componentDidMount(){
        addNextPageKeyNavigation(this);
    }

    componentWillUnmount(){
        removeNextPageKeyNavigation(this);
    }

    /**
     * to open next page
     */
    openNextPage() {
        const {link, router, loadPage, current} = this.props;
        if(!loadPage) {
            if (link !== '' && link !== -1) {
                router.push(link);
            }
        } else{
            loadPage(current);
        }
    }
    
    render(){
        const {link, isLast} = this.props;
        let className = styles.next_page;
        if(link === -1 || link === ''){
            className += ' ' + styles.disable_arrow;
        }
        return(
            <Pagination.Next onClick={this.openNextPage} disabled={isLast}/>
        );
    }
}

NextPage.defaultProps = {
    loadPage: null,
};

export default withRouter(NextPage);