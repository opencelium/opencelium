import React, {FC} from 'react';
import { TableProps } from './interfaces';
import { TableStyled } from './styles';

const Table: FC<TableProps> =
    ({
        marginBottom,
        children,
     }) => {
        return (
            <TableStyled marginBottom={marginBottom}>
                {children}
            </TableStyled>
        )
    }

export {
    Table,
};