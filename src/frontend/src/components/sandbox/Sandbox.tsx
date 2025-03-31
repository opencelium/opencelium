import React from 'react';
import OperatorBuilder from "@app_component/operator_builder/OperatorBuilder";
import {OperatorType} from "@app_component/operator_builder/props";

const Sandbox = () => {
    return (
        <OperatorBuilder connection={null} connector={null} item={null} updateConnection={null} type={OperatorType.If}/>
    )
}

export default Sandbox;
