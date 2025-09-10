import React, {useState} from 'react';
import {TextSize} from "@app_component/base/text/interfaces";
import {ColorTheme} from "@style/Theme";
import {copyStringToClipboard} from "@application/utils/utils";
import Button from "@app_component/base/button/Button";
import {useAppDispatch} from "@application/utils/store";
import {NavItem, NavLink} from "reactstrap";
import styles from "@app_component/connection_logs/ConnectorPanel/TraceItem/MethodTrace/MethodTrace.module.css";
import {NavLinkProps} from "reactstrap/es/NavLink";
import {copyLogContentToClipboard} from "@root/redux_toolkit/slices/ConnectionLogSlice";

const NavItemLog = (props: {navLinkProps: NavLinkProps, title: string, content: string}) => {
    const dispatch = useAppDispatch();
    return (
        <NavItem>
            <NavLink
                {...props.navLinkProps}
                className={styles.navLink}
            >
                <span>{props.title}</span>
                <Button
                    iconSize={TextSize.Size_12}
                    icon={'file_copy'}
                    hasBackground={false}
                    color={ColorTheme.Turquoise}
                    handleClick={() => {
                        copyStringToClipboard(props.content);
                        dispatch(copyLogContentToClipboard())
                    }}
                    style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                    }}
                />
            </NavLink>
        </NavItem>
    )
}

export default NavItemLog;
