import styled from "styled-components";
import {TableStyledProps} from './interfaces';

const TableStyled = styled.table<TableStyledProps>`
    width: 100%;
    & th, & td{
        text-align: center;
    }
    & td{
        border-top: 1px solid rgb(222, 226, 230);
    }
    & th{
        text-transform: capitalize;
        padding: 10px 0;
    }
    & thead{
        & > span{
            margin-right: 5px;
        }
        & tr{
            & th:first-child{
                padding-left: 15px;
            }
            & th:last-child{
                padding: 0 15px;
            }
        }
    }
    & tbody{
        & tr{
            border-top: 1px solid #aaa;
            & td{
                padding: 10px 0;
            }
            & td:first-child{
                padding-left: 15px;
            }
            & td:last-child{
                padding: 0 15px;
            }
        }
    }
    margin-bottom: ${({marginBottom}) => marginBottom || 0};
`;

export {
    TableStyled,
}