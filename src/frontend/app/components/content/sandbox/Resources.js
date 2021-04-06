import React from 'react';
import getResources from "@decorators/getResources";


@getResources(['invokers', 'connectors'], {isBackground: true})
class Resources extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {invokers, connectors} = this.props;
        return(
            <div>
                <div>{`Invokers: ${invokers.length}`}</div>
                <div>{`Connectors: ${connectors.length}`}</div>
            </div>
        );
    }
}

export default Resources;