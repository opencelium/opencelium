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


/**
 * Component for Pages
 */
class Pages extends Component{

    constructor(props){
        super(props);
    }

    openPage(pageNumber){
        const {router, link, loadPage, current} = this.props;
        if(typeof loadPage !== 'function') {
            router.push(`${link}${pageNumber}`);
        } else{
            loadPage(pageNumber);
        }
    }

    renderPages(){
        let pages = [];
        const {total, current} = this.props;
        for(let i = 1; i <= total; i++){
            if(i === current){
                pages.push(<Pagination.Item key={i} active>{i}</Pagination.Item>);
            } else {
                pages.push(<Pagination.Item key={i} onClick={() => this.openPage(i)}>{i}</Pagination.Item>);
            }
        }
        /*
        for(let i = 1; i <= total; i++){
            if(i === current){
                pages.push(<span key={i} className={styles.current_page}>{i}</span>);
            } else {
                pages.push(<span key={i} className={styles.page} onClick={() => this.openPage(i)}>{i}</span>);
            }
        }*/
        return pages;
    }

    render(){
        return (
            [this.renderPages()]
        );
    }
}

Pages.defaultProps = {
    loadPage: null,
};

export default withRouter(Pages);