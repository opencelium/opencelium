import React, {FC} from 'react';
import {
    ArgumentsProps,
} from "./interfaces";
import Argument from './Argument';


const Arguments:FC<ArgumentsProps> = ({args, readOnly}) => {
    return (
        <React.Fragment>
            {args.map((argument, key) => {
                return <Argument argument={argument} id={key} readOnly={readOnly}/>
            })}
        </React.Fragment>
    )
}

export default Arguments;
