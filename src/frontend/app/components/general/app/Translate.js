import React from 'react';
import { Trans } from 'react-i18next';


class Translate extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        return(
            <Trans {...this.props}>{this.props.children}</Trans>
        );
    }
}

export default Translate;