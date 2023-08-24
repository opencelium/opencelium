import styled from 'styled-components';

export const ArgumentContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 10px;
`;

export const FormContainer = styled.div`
    width: ${({isView}: {isView?: boolean}) => isView ? '50%' : '43%'};
`;

export const ButtonContainer = styled.div`
    width: 16%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
`;
