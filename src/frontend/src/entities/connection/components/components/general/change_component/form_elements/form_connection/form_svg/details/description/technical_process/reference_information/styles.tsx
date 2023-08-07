import styled from 'styled-components';

export const TargetFieldStyled = styled.span`
    color: #305964;
`;

export const SourceFieldStyled = styled.span`
    color: #cb4b16;
`;

export const SourceMethodNameStyled = styled.span`
    font-weight: bold;
    padding: 3px;
    border-radius: 3px;
`;

export const ReferenceBlockStyled = styled.div`
    margin-left: 30px;
    margin-top: 5px;
`;

export const FieldBindingBlockStyled = styled.div`
    margin: 5px;
    padding: 3px;
    cursor: pointer;
    &:hover{
        border-radius: 5px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    }
`;

export const FieldBindingsBlockStyled = styled.div`
    overflow-y: auto;
    max-height: calc(100% - 36px);
`;

export const ReferenceInformationStyled = styled.div`
    overflow: hidden;
`;
