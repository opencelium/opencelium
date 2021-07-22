import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/layout/menu";
import React from "react";
import {Link as ReactRouterLink} from "react-router";
import LogoOcWhiteImagePath from "assets/logo_oc_white.png";

const LinkLogo = (props) => {
    return (
        <div {...props}>
            {props.children}
        </div>
    );
};
const Link = (props) => {
    return (
        <a {...props}>
            {props.children}
        </a>
    );
};

export const MenuIcon = (props) => {
    return(
        <FontIcon className={styles.nav_icon} size={30} {...props}/>
    );
}

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
            <MenuIcon value={props.value}/>
            <span className={styles.nav_name}>{props.label}</span>
        </ReactRouterLink>
    )
}
export const MenuLinkLogo = (props) => {
    return(
        <ReactRouterLink
            onlyActiveOnIndex={true}
            to={'/'}
            className={styles.menu_link_logo}
            component={LinkLogo}
            onClick={props.onClick ? props.onClick : () => {}}
        >
            <img className={styles.logo_image} src={LogoOcWhiteImagePath} alt={'OpenCelium'}/>
            <span className={styles.nav_logo_text}>
                <span>{'OpenCelium'}</span>
            </span>
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
                <MenuIcon value={value}/>
                <span className={styles.nav_name}>{label}</span>
                <FontIcon className={collapseIconClassName} size={18} value={'expand_more'} onClick={::this.onToggleCollapse}/>
                <ul className={collapseMenuClassName}>
                    {subLinks.map(subLink => <ReactRouterLink key={subLink.label} onlyActiveOnIndex to={subLink.to} className={`${styles.main_menu_collapse_sublink}`}>{subLink.label}</ReactRouterLink>)}
                </ul>
            </ReactRouterLink>
        )
    }
}