import styled from "styled-components";
import {DropdownMenu} from "reactstrap";

const EmptyListStyled = styled.div`
    
`;

const TypesStyled = styled.span`
    display: flex;
    margin-bottom: 5px;
    cursor: pointer;
    padding: 2px;
    & :hover{
      background: #eee;
    }
    & > span{
        fontWeight: 600;
        margin: 0 10px;
    }
`;

const DropdownMenuStyled = styled(DropdownMenu)`
    min-width: 100px;
    top: -7px;
    left: -100px;
`

export {
    EmptyListStyled,
    TypesStyled,
    DropdownMenuStyled,
}