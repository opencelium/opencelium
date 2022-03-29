import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { LinkMessageProps } from './interfaces';
import { LinkMessageStyled } from './styles';
import { setSearchValue } from '@store/reducers/application/ApplicationSlice';

const LinkMessage: FC<LinkMessageProps> =
    ({
        link,
        message,
        shouldSetSearchValue,
        dispatch,
        navigate,
    }) => {
    const notClickable = link === '';
    let onClick = () => {};
    if(!notClickable){
        onClick = () => {
            if(shouldSetSearchValue && dispatch){
               dispatch(setSearchValue(message));
            }
            if(navigate){
                navigate(link, { replace: false });
            }
        }
    }
    return (
        <LinkMessageStyled onClick={onClick} notClickable={notClickable}>
            {message}
        </LinkMessageStyled>
    )
}

LinkMessage.defaultProps = {
    link: '',
    shouldSetSearchValue: true,
    dispatch: null,
    navigate: null,
}


export {
    LinkMessage,
};

export default withTheme(LinkMessage);