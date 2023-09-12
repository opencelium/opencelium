import React, {FC} from 'react';
import {
    ArgumentsProps,
} from "./interfaces";
import Argument from './Argument';


const Arguments:FC<ArgumentsProps> = ({add, update, deleteArg, args, readOnly}) => {
    return (
        <React.Fragment>
            {args.map((argument, key) => {
                return <Argument key={argument.name} argIndex={key} args={args} add={add} deleteArg={() => deleteArg(key)} isView={readOnly} isUpdate={true} update={(a) => update(key, a)} argument={argument} id={argument.name}/>
            })}
        </React.Fragment>
    )
}

export default Arguments;
