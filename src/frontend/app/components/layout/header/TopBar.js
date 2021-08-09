import React from 'react';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Input from "@basic_components/inputs/Input";

import styles from "@themes/default/layout/header.scss";
import {withRouter} from "react-router";


class TopBar extends React.Component{
    constructor(props) {
        super(props);
    }

    onClickSearchIcon(){

    }

    onClickNotifications(){

    }

    onClickMyProfile(){
        this.props.router.push('/myprofile');
    }

    render(){
        return(
            <div className={styles.top_bar}>
                <Input className={styles.search_input} placeholder={'Search'}/>
                <TooltipFontIcon tooltip={'Search'} value={'search'} tooltipPosition={'bottom'} iconClassName={styles.search_icon} isButton onClick={::this.onClickSearchIcon}/>
                <TooltipFontIcon tooltip={'Notifications'} value={'notifications'} tooltipPosition={'bottom'} isButton onClick={::this.onClickNotifications}/>

                    <TooltipFontIcon tooltip={'My Profile'} value={'face'} tooltipPosition={'bottom'} isButton onClick={::this.onClickMyProfile}/>

            </div>
        );
    }
}

export default withRouter(TopBar);