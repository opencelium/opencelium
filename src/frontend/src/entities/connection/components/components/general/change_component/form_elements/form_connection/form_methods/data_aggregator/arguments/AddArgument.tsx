import React, {FC, useState} from 'react';
import {
    AddArgumentProps,
} from "./interfaces";
import Argument from './Argument';


const AddArgument:FC<AddArgumentProps> =
    ({
        add,
        args,
    }) => {
    return (
        <Argument args={args} argument={{name: '', description: ''}} id={'add'} isAdd={true} add={add}/>
    )
}

export default AddArgument;
