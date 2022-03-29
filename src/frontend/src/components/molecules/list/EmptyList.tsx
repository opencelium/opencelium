import React, {FC} from 'react';
import {EmptyListStyled} from './styles';
import {Text} from "@atom/text/Text";
import {TextSize} from "@atom/text/interfaces";

const EmptyList: FC =
    ({

    }) => {
    return (
        <EmptyListStyled >
            <Text value={'There are no results.'} size={TextSize.Size_14}/>
        </EmptyListStyled>
    )
}

EmptyList.defaultProps = {
}


export {
    EmptyList,
};
