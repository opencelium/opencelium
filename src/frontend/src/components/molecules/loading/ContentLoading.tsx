import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { LoadingProps } from './interfaces';
import { ContentLoadingStyled } from './styles';

const ContentLoading: FC<LoadingProps> =
    ({
         ...props
     }) => {
        return (
            <ContentLoadingStyled {...props}/>
        )
    }

ContentLoading.defaultProps = {
}


export {
    ContentLoading,
};

export default withTheme(ContentLoading);