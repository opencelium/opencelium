/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React, {FC, useState} from 'react';
import {useNavigate} from "react-router";
import {withTheme} from "styled-components";
import { NO_RESTRICTION } from '@application/interfaces/IApplication';
import {Size} from "@application/classes/Size";
import Dialog from "../dialog/Dialog";
import Text from "../text/Text";
import {ButtonProps} from './interfaces';
import Icon from '../icon/Icon';
import {ButtonStyled, LabelStyled} from './styles';

const Button: FC<ButtonProps> =
    ({
        id,
        hasConfirmation,
        confirmationText,
        background,
        icon,
        label,
        size,
        isDisabled,
        isLoading,
        color,
        theme,
        hasBackground,
        handleClick,
        href,
        className,
        iconSize,
        loadingSize,
        ...styles
    }) => {
    const [isConfirmationOpened, toggleConfirmation] = useState<boolean>(false);
    const hasIcon = !!icon;
    const isLabelHidden = !icon && isLoading;
    const hasLabel = !!label && !isLabelHidden;
    let navigate = useNavigate();
    let onClick = () => {
        if(href){
            navigate(href, { replace: false });
        } else{
            handleClick();
        }
        hasConfirmation && toggleConfirmation(false);
    };
    const instanceSize = new Size(size);
    if(!icon && !label && !isLoading){
        return null;
    }
    return (
        <ButtonStyled id={id} className={className} isDisabled={isDisabled} hasLabel={hasLabel} size={instanceSize.size} onClick={hasConfirmation ? () => toggleConfirmation(true) : onClick} color={color} background={background} disabled={isDisabled} hasBackground={hasBackground} isContentCentralized={isLabelHidden} {...styles}>
            <Icon isLoading={isLoading} name={icon} size={iconSize || instanceSize.size} loadingSize={loadingSize} color={ hasBackground ? color || theme.button.color.quite : background || theme.button.background.quite}/>
            {hasLabel && <Text value={<LabelStyled hasIcon={hasIcon} opacity={isLabelHidden ? 0 : 1} color={color} size={instanceSize.size} hasBackground={hasBackground}>{label}</LabelStyled>}/>}
            {
                hasConfirmation &&
                <Dialog
                    actions={[{label: 'Yes', onClick, id: 'confirmation_yes'},{label: 'No', onClick: () => toggleConfirmation(false), id: 'confirmation_no'}]}
                    active={isConfirmationOpened}
                    toggle={() => toggleConfirmation(!isConfirmationOpened)}
                    title={'Confirmation'}
                >
                    <span>
                        {confirmationText}
                    </span>
                </Dialog>
            }
        </ButtonStyled>
    )
}

Button.defaultProps = {
    iconSize: '24px',
    size: 16,
    href: '',
    hasBackground: true,
    permission: NO_RESTRICTION,
    hasConfirmation: false,
    confirmationText: '',
    className: '',
    isLoading: false,
    loadingSize: '',
}

export {
    Button,
}


export default withTheme(Button);