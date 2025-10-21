import React from 'react';
import {NavItem, NavLink} from "reactstrap";
import styles from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/MethodTrace.module.css";
import {NavLinkProps} from "reactstrap/es/NavLink";

const NavItemLog = (props: {navLinkProps: NavLinkProps, title: string | any}) => {
    return (
        <NavItem>
            <NavLink
                {...props.navLinkProps}
                className={styles.navLink}
            >
                <span>{props.title}</span>
            </NavLink>
        </NavItem>
    )
}

export default NavItemLog;
