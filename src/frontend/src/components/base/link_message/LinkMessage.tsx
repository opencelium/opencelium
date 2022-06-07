/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { setSearchValue } from '@application/redux_toolkit/slices/ApplicationSlice';
import { LinkMessageProps } from './interfaces';
import { LinkMessageStyled } from './styles';

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