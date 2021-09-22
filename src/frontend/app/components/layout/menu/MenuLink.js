import FontIcon from "@basic_components/FontIcon";
import styles from "@themes/default/layout/menu";
import React from "react";
import {Link as ReactRouterLink} from "react-router";
import LogoOcWhiteImagePath from "assets/logo_oc_white.png";
import {permission} from "@decorators/permission";
import {connect} from "react-redux";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

@connect(mapStateToProps, {})
@permission()
class PermissionLink extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {children, permission, authUser, ...props} = this.props;
        return(
            <ReactRouterLink {...props}>{children}</ReactRouterLink>
        )
    }
}

const LinkBlock = React.forwardRef((props, ref) => (
    <div ref={ref} {...props}>
        {props.children}
    </div>
))
const Link = React.forwardRef((props, ref) => (
    <a ref={ref} {...props}>
        {props.children}
    </a>
))

export const MenuIcon = (props) => {
    if(props.tooltip){
        return(
            <TooltipFontIcon whiteTheme className={styles.nav_icon} size={30} {...props}/>
        );
    } else{
        return(
            <FontIcon whiteTheme className={styles.nav_icon} size={30} {...props}/>
        );
    }
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
            <MenuIcon value={props.value} size={props.size}/>
            <span className={styles.nav_name}>{props.label}</span>
        </ReactRouterLink>
    )
}
MenuLink.defaultProps = {
    size: 30,
}
export const MenuLinkLogo = (props) => {
    return(
        <ReactRouterLink
            onlyActiveOnIndex={true}
            to={'/'}
            className={styles.menu_link_logo}
            component={LinkBlock}
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
        let collapseIconClassName = styles.main_menu_collapse_icon;
        if(!isCollapsed && isMainMenuExpanded){
            collapseMenuClassName += ` ${styles.show_sub_links}`;
            collapseIconClassName += ` ${styles.rotate}`
        }
        return(
            <div className={`${styles.nav_link} ${styles.main_menu_collapse}`}>
                <MenuIcon value={value}/>
                <ReactRouterLink key={label} onlyActiveOnIndex to={to} className={`${styles.main_menu_collapse_link}`}>{label}</ReactRouterLink>
                <FontIcon whiteTheme className={collapseIconClassName} size={18} value={'expand_more'} onClick={::this.onToggleCollapse}/>
                <ul className={collapseMenuClassName}>
                    {subLinks.map(subLink => <PermissionLink key={subLink.label} permission={subLink.permission} onlyActiveOnIndex to={subLink.to} className={`${styles.main_menu_collapse_sublink}`}>{subLink.label}</PermissionLink>)}
                </ul>
            </div>
        )
    }
}