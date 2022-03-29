import React, {FC, useEffect} from 'react';
import {Pagination as ReactPagination, PaginationItem, PaginationLink} from "reactstrap";
import {PaginationProps} from "./interfaces";

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
    }, [total])
    for(let i = startIndex; i <= endIndex; i++){
        paginationItems.push(
            <PaginationItem key={i} active={currentPage === i}>
                <PaginationLink onClick={() => setCurrentPage(i)}>
                    {i}
                </PaginationLink>
            </PaginationItem>
        );
    }
    return (
        <ReactPagination aria-label="Page navigation example" style={{paddingBottom: '30px'}}>
            <PaginationItem disabled={currentPage === 1}>
                <PaginationLink
                    first
                    onClick={() => setCurrentPage(1)}
                />
            </PaginationItem>
            <PaginationItem disabled={currentPage === 1}>
                <PaginationLink
                    previous
                    onClick={() => setCurrentPage(currentPage - 1)}
                />
            </PaginationItem>
            {paginationItems}
            <PaginationItem disabled={currentPage === total}>
                <PaginationLink
                    next
                    onClick={() => setCurrentPage(currentPage + 1)}
                />
            </PaginationItem>
            <PaginationItem disabled={currentPage === total}>
                <PaginationLink
                    last
                    onClick={() => setCurrentPage(total)}
                />
            </PaginationItem>
        </ReactPagination>
    )
}

Pagination.defaultProps = {
}


export {
    Pagination,
};
