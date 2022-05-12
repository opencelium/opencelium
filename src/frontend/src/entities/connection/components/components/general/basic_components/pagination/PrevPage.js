/*
 * Copyright (C) <2022>  <becon GmbH>
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


import {addPrevPageKeyNavigation, removePrevPageKeyNavigation} from '@entity/connection/components/utils/key_navigation';

import styles from '@entity/connection/components/themes/default/general/pagination.scss';
import CVoiceControl from "@entity/connection/components/classes/voice_control/CVoiceControl";
import CPaginationControl from "@entity/connection/components/classes/voice_control/CPaginationControl";


/**
 * Component for Previous Page
 */
class PrevPage extends Component{

    constructor(props){
        super(props);

        this.openPrevPage = this.openPrevPage.bind(this);
    }

    componentDidMount(){
        addPrevPageKeyNavigation(this);
        CVoiceControl.initCommands({component:this}, CPaginationControl);
    }

    componentWillUnmount(){
        removePrevPageKeyNavigation(this);
        CVoiceControl.removeCommands({component:this}, CPaginationControl);
    }

    /**
     * to open previous page
     */
    openPrevPage(){
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
        const {link, isFirst} = this.props;
        let className = styles.prev_page;
        if(link === -1 || link === ''){
            className += ' ' + styles.disable_arrow;
        }
        return(
            <Pagination.Prev onClick={this.openPrevPage} disabled={isFirst}/>
        );
    }
}

PrevPage.defaultProps = {
    loadPage: null,
};

export default withRouter(PrevPage);