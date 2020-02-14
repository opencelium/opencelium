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
import { withRouter } from 'react-router';
import {Pagination as BootPagionation} from 'react-bootstrap';

import { Row } from "react-grid-system";
import styles from '../../../../themes/default/general/pagination.scss';
import PrevPage from "./PrevPage";
import Pages from "./Pages";
import NextPage from "./NextPage";

export const ENTITIES_PRO_PAGE = 4;


/**
 * Component for Pagination
 */
class Pagination extends Component{

    constructor(props){
        super(props);
        this.page = {
            current: 1,
            total: 1,
            link: props.page.link,
            pageNumber: props.page.pageNumber || 1,
        };
    }

    /**
     * to set settings for pagination
     */
    setPageSettings(props){
        const {setTotalPages} = this.props;
        const {pageNumber, entitiesLength, link} = props.page;
        if(typeof pageNumber !== 'undefined') {
            this.page.current = pageNumber ? parseInt(pageNumber) : 1;
        }
        this.page.total = Math.ceil(entitiesLength / ENTITIES_PRO_PAGE);
        if(this.page.total <= 0){
            this.page.total = 1;
        }
        this.page.link = link;
        setTotalPages(this.page.total);
    }

    renderNext(){
        const {current, total, link} = this.page;
        let next = -1;
        if(current + 1 <= total) {
            next = link + parseInt(current + 1);
        }
        return <NextPage link={next} isLast={current === total}/>;
    }

    renderPrev(){
        const {current, link} = this.page;
        let prev = -1;
        if(current - 1 >= 1){
            prev = link + parseInt(current - 1);
        }
        return <PrevPage link={prev} current={current} isFirst={current === 1}/>;
    }

    render(){
        if (this.props.page.entitiesLength > 0) {
            this.setPageSettings(this.props);
            const {router} = this.props;
            const {current, total, link} = this.page;
            if(current > total && total > 0) {
                if (parseInt(current - 1) === total) {
                    router.push(link + parseInt(current - 1));
                }
            }
        }
        const {current, total, link} = this.page;
        if(total === 1){
            return null;
        }
        return (
            <Row className={styles.row}>
                <div className={styles.container}>
                    <BootPagionation className='justify-content-center'>
                        {this.renderPrev()}
                            {/*<span className={styles.pagination}>*/}
                                <Pages current={current} total={total} link={link}/>
                            {/*</span>*/}
                        {this.renderNext()}
                    </BootPagionation>
                </div>
            </Row>
        );
    }
}

export default withRouter(Pagination);