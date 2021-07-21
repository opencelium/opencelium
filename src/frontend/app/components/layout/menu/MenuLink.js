import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/layout/menu";
import React from "react";
import {Link as ReactRouterLink} from "react-router";

const Link = (props) => {
    return (
        <a {...props}>
            {props.children}
        </a>
    );
};

export const MenuLink = (props) => {
    return(
        <ReactRouterLink
            className={styles.nav_link}
            onlyActiveOnIndex={true}
            activeClassName={styles.active}
            to={props.to ? props.to : ''}
            component={Link}
            onClick={props.onClick ? props.onClick : () => {}}
        >
            <FontIcon className={styles.nav_icon} value={props.value} size={20}/>
            <span className={styles.nav_name}>{props.label}</span>
        </ReactRouterLink>
    )
}

export class MenuLinkWithSubLinks extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isCollapsed: true,
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const {isMainMenuExpanded} = this.props;
        if(!isMainMenuExpanded && !this.state.isCollapsed && isMainMenuExpanded !== prevProps.isMainMenuExpanded){
            this.setState({
                isCollapsed: true,
            });
        }
    }

    onToggleCollapse(e){
        e.preventDefault();
        this.setState({
            isCollapsed: !this.state.isCollapsed,
        })
    }

    render(){
        const {isCollapsed} = this.state;
        const {isMainMenuExpanded, to, value, label, subLinks} = this.props;
        let collapseMenuClassName = styles.main_menu_collapse_menu;
        let collapseIconClassName = styles.main_menu_collapse_link;
        if(!isCollapsed && isMainMenuExpanded){
            collapseMenuClassName += ` ${styles.show_sub_links}`;
            collapseIconClassName += ` ${styles.rotate}`
        }
        return(
            <ReactRouterLink
                className={`${styles.nav_link} ${styles.main_menu_collapse}`}
                onlyActiveOnIndex={true}
                activeClassName={styles.active}
                to={to}
                component={Link}
            >
                <FontIcon className={styles.nav_icon} size={20} value={value}/>
                <span className={styles.nav_name}>{label}</span>
                <FontIcon className={collapseIconClassName} size={18} value={'expand_more'} onClick={::this.onToggleCollapse}/>
                <ul className={collapseMenuClassName}>
                    {subLinks.map(subLink => <ReactRouterLink key={subLink.label} onlyActiveOnIndex to={subLink.to} className={`${styles.main_menu_collapse_sublink}`}>{subLink.label}</ReactRouterLink>)}
                </ul>
            </ReactRouterLink>
        )
    }
}