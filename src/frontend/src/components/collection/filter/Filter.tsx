import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { FilterProps } from './interfaces';
import { FilterStyled } from './styles';

const Filter: FC<FilterProps> =
    ({
        children,
    }) => {
    return (
        <FilterStyled >
            {children}
        </FilterStyled>
    )
}

Filter.defaultProps = {
}


export {
    Filter,
};

export default withTheme(Filter);