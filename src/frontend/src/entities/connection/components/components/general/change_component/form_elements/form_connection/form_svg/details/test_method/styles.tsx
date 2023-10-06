import styled from "styled-components";

export const TestMethodFormWrapper = styled.div`
  display: flex;
`;

export const TestMethodFormContainer = styled.div`
  width: 50%;
`;

export const TestMethodFormDivider = styled.div`
  width: 2px;
  margin: 0 16px;
  background-color: #dee2e6;
`;

export const TestMethodTitle = styled.h5`
  margin-bottom: 20px;
`;

export const TestMethodDialogFormJsonWrap = styled.div`
  display: flex;
  position: relative;
  align-items: flex-start;
  margin-bottom: 20px;
`;

export const TestMethodDialogFormJsonLabel = styled.span`
  position: absolute;
  top: 0;
  left: 50px;
  z-index: 10;
  font-size: 12px;
  font-family: "Open Sans","Arial",sans-serif;
  text-transform: capitalize;
`