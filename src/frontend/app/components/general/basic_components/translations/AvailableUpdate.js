import Translate from "@components/general/app/Translate";
import {Link, withRouter} from "react-router";
import React from "react";
import {history} from "@components/App";

class AvailableUpdate extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {version} = this.props;
        return (
            <Translate i18nKey="notifications:SUCCESS.FETCH_UPDATEAPPVERSION"
                       values={{version}}
                       components={[
                           <a href={'#'} onClick={() => history.push('/update_assistant')} children={version} />
                       ]}/>
        );
    }
}

export default withRouter(AvailableUpdate);