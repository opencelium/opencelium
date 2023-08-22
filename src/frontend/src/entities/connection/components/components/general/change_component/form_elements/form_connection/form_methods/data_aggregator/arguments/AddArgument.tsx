import React, {FC, useState} from 'react';
import {
    AddArgumentProps,
} from "./interfaces";
import Argument from './Argument';


const AddArgument:FC<AddArgumentProps> = ({}) => {
    return (
        <Argument argument={{name: '', description: ''}} id={'add'} isAdd={true}/>
    )
}

export default AddArgument;
