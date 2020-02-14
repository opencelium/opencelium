/*
 * Copyright (C) <2019>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react';
import {connect} from "react-redux";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import {changeLanguage} from "../../actions/app";
import {defaultLanguage} from "../../utils/constants/languages";
import {addUserInStore} from '../../actions/users/add';

import { addUserListener,
} from '../../utils/socket/users';
import LayoutError from "./LayoutError";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
        isAuth: auth.get('isAuth'),
        currentLanguage: auth.get('authUser') ? auth.get('authUser').current_language : defaultLanguage.code,
    };
}

/**
 * Layout of the app(OC)
 */
@connect(mapStateToProps, {changeLanguage, addUserInStore})
class Layout extends Component{

    constructor(props){
        super(props);

        this.state = {
            isMenuVisible: false,
            authUser: props.authUser,
        };
    }

    componentDidMount(){
        const {addUserInStore} = this.props;
        addUserListener(addUserInStore);
    }

    toggleMenu(){
        this.setState({isMenuVisible: !this.state.isMenuVisible});
    }

    hideMenu(){
        this.setState({isMenuVisible: false});
    }

    renderHeader(){
        if(this.props.isAuth){
            return <Header toggleMenu={::this.toggleMenu} hideMenu={::this.hideMenu} router={this.props.router}/>;
        }
        return null;
    }

    renderFooter(){
        if(this.props.isAuth){
            return <Footer/>;
        }
    }

    renderLayout(){
        return (
            <div>
                {this.renderHeader()}
                <div>
                    {this.props.children}
                </div>
                {this.renderFooter()}
            </div>
        );
    }
    
    render(){
        return (
            <div>
                <LayoutError>
                    {this.renderLayout()}
                </LayoutError>
            </div>
        );
    }
}
export default Layout;