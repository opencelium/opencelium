import React, {FC, Suspense} from 'react';
import {ThemeProvider, withTheme} from 'styled-components';
import Themes, {ThemeNames} from "./general/Theme";
import {BrowserRouter} from "react-router-dom";
import {Global} from "../styles/global";
import {getRoutes} from "@store/routes";
import {Auth} from "@class/../classes/application/Auth";

const App = ({}) => {
    const {authUser} = Auth.getReduxState();
    let theme: ThemeNames = authUser?.userDetail?.theme || null;
    let appTheme: any = theme ? Themes[theme] : Themes.default;
    return (
        <ThemeProvider theme={appTheme}>
            <BrowserRouter>
                <Global/>
                {getRoutes()}
            </BrowserRouter>
        </ThemeProvider>
    )
}

App.defaultProps = {
}


export {
    App,
};

export default withTheme(App);