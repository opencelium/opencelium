import React from 'react';
import {NavItem, NavLink} from "reactstrap";
import styles from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/MethodTrace.module.css";
import {NavLinkProps} from "reactstrap/es/NavLink";
import DefaultText from "@app_component/base/text/DefaultText";

const NavItemLog = (props: {navLinkProps: NavLinkProps, title: string}) => {
    return (
        <NavItem>
            <NavLink
                {...props.navLinkProps}
                className={styles.navLink}
            >
                <DefaultText value={props.title}/>
            </NavLink>
        </NavItem>
    )
}

export default NavItemLog;
