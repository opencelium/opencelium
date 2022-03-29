import styled from "styled-components";
import {PermissionsStyledProps} from "./interfaces";

const PermissionsStyled = styled.table<PermissionsStyledProps>`
    ${({hasLabel}) => hasLabel ? 'margin-top: 18px;' : ''}
    width: 100%;
    & th, & td{
        text-align: center;
    }
    & th{
        text-transform: capitalize;
    }
    & thead{
        & span{
            margin-right: 5px;
        }
    }
    & tbody{
        & tr{
            border-top: 1px solid rgb(222, 226, 230);
            & td{
                padding: 10px 0;
            }
        }
        & tr:hover{
            background: #eee;
        }
    }
    padding-left: ${({paddingLeft}) => paddingLeft || 0};
    padding-right: ${({paddingRight}) => paddingRight || 0};
    width: ${({width, isIconInside, hasIcon, theme}) => width || isIconInside || !hasIcon ? '100%' : `calc(100% - ${theme.input.iconInputDistance})`};
    margin-left: ${({hasIcon, isIconInside, theme}) => !hasIcon || isIconInside ? 0 : theme.input.iconInputDistance};
`

export {
    PermissionsStyled,
}