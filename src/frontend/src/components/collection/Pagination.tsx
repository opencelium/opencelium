/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, { FC, useEffect } from 'react';
import { Pagination as ReactPagination } from "reactstrap";
import { PaginationProps } from "./interfaces";
import {PaginationItemStyled, PaginationLinkStyled} from "@app_component/collection/styles";

//must be odd
const MAX_PAGES = 5;


const Pagination: FC<PaginationProps> =
    ({
        currentPage,
        total,
        setCurrentPage,
    }) => {
    if(total < 2){
        return null;
    }
    const paginationItems = [];
    let startIndex = 1;
    let endIndex = MAX_PAGES > total ? total : MAX_PAGES;
    const halfPageNumber = Math.ceil(MAX_PAGES / 2);
    if(currentPage > halfPageNumber && total >= MAX_PAGES){
        startIndex = currentPage + halfPageNumber > total ? total - MAX_PAGES + 1: currentPage - halfPageNumber + 1;
        endIndex = currentPage + halfPageNumber > total ? total : currentPage + halfPageNumber - 1;
    }
    useEffect(() => {
        if(currentPage > total){
            setCurrentPage(total);
        }
    }, [total, currentPage])
    for(let i = startIndex; i <= endIndex; i++){
        paginationItems.push(
            <PaginationItemStyled key={i} active={currentPage === i}>
                <PaginationLinkStyled onClick={() => setCurrentPage(i)}>
                    {i}
                </PaginationLinkStyled>
            </PaginationItemStyled>
        );
    }
    return (
        <ReactPagination aria-label="Page navigation example" style={{paddingBottom: '30px'}}>
            <PaginationItemStyled disabled={currentPage === 1}>
                <PaginationLinkStyled
                    first
                    onClick={() => setCurrentPage(1)}
                />
            </PaginationItemStyled>
            <PaginationItemStyled disabled={currentPage === 1}>
                <PaginationLinkStyled
                    previous
                    onClick={() => setCurrentPage(currentPage - 1)}
                />
            </PaginationItemStyled>
            {paginationItems}
            <PaginationItemStyled disabled={currentPage === total}>
                <PaginationLinkStyled
                    next
                    onClick={() => setCurrentPage(currentPage + 1)}
                />
            </PaginationItemStyled>
            <PaginationItemStyled disabled={currentPage === total}>
                <PaginationLinkStyled
                    last
                    onClick={() => setCurrentPage(total)}
                />
            </PaginationItemStyled>
        </ReactPagination>
    )
}

Pagination.defaultProps = {
}


export {
    Pagination
};

