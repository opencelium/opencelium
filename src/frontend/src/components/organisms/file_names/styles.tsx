import styled from "styled-components";

const FileNamesStyled = styled.div`
    margin-left: 20px;
`;

const FileNameStyled = styled.div`
    font-family: $FONT_FAMILY;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`;

const NoFilesStyled = styled.div`
    margin-bottom: 20px;
`;

const FilesStyled = styled.div`
    margin-bottom: 20px;
`

export {
    FileNamesStyled,
    FileNameStyled,
    NoFilesStyled,
    FilesStyled,
}