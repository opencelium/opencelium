import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {TextSize} from "@atom/text/interfaces";
import {LoadingProps} from "@molecule/loading/interfaces";
import {ColorTheme} from "../../general/Theme";
import { LoadingStyled } from './styles';

const Loading: FC<LoadingProps> =
    ({
        size,
        color,
        className,
        theme,
    }) => {
    return (
        <LoadingStyled className={className} isLoading={true} name={''} size={size} color={theme?.menu?.background || color || ColorTheme.Blue}/>
    )
}

Loading.defaultProps = {
    size: TextSize.Size_30,
    className: '',
}


export {
    Loading,
};

export default withTheme(Loading);