/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { withRouter } from 'react-router';

import {Row, Col} from 'react-grid-system';

import styles from '../../../themes/default/general/content.scss';
import {permission} from "../../../decorators/permission";
import {formatHtmlId, getThemeClass, isString} from "../../../utils/app";
import Button from "../basic_components/buttons/Button";
import {generateLabel} from "../../../utils/app";
import FontIcon from "../basic_components/FontIcon";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}


/**
 * Navigation Button for Content
 */
@connect(mapStateToProps, {})
@permission()
class ContentNavigationButton extends Component{

    constructor(props){
        super(props);
    }

    componentDidUpdate(){
        if(this.props.isPressedButton){
            this.click();
        }
    }

    /**
     * to redirect after click on button
     */
    click(){
        const {router, link, onClick} = this.props;
        if(link !== '') {
            router.push(link);
        } else{
            if(typeof onClick === 'function'){
                onClick();
            }
        }
    }

    renderTitle(){
        const {authUser} = this.props;
        let {title} = this.props;
        let classNames = ['navigation_button_title', 'navigation_button_title_letter'];
        classNames = getThemeClass({classNames, authUser, styles});
        let titleIndex = 0;
        if(title === '' || !title){
            return null;
        }
        if(!isString(title)){
            if(title.hasOwnProperty('title')){
                if(title.hasOwnProperty('index')){
                    titleIndex = title.index;
                }
                title = title.title;
            }
        }
        return generateLabel(title, titleIndex, {keyNavigationTitle: styles[classNames.navigation_button_title], keyNavigationLetter: styles[classNames.navigation_button_title_letter]});
    }

    render(){
        const {icon, className, authUser, type, buttonClassname} = this.props;
        let {title} = this.props;
        if(!isString(title)){
            if(title && title.hasOwnProperty('title')){
                title = title.title;
            }
        }
        let classNames = ['navigation_button'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Row className={className}>
                <Col>
                    {
                        type !== 'add' 
                            ?
                            <span className={styles[classNames.navigation_button]} onClick={::this.click} id={formatHtmlId(`button_${title}`)}>
                                {icon !== '' ? <FontIcon value={icon}/> : null}
                                {::this.renderTitle()}
                            </span>
                            :
                            <Button authUser={authUser} title={title} icon={icon} onClick={::this.click} className={buttonClassname}/>
                    }
                </Col>
                    
            </Row>
        );
    }
}

ContentNavigationButton.propTypes = {
    link: PropTypes.string.isRequired,
    isPressedButton: PropTypes.bool,
    permission: PropTypes.object.isRequired,
    authUser: PropTypes.object.isRequired,
    type: PropTypes.string,
};

ContentNavigationButton.defaultProps = {
    isPressedButton: false,
    type: 'nothing',
    buttonClassname: '',
};

export default withRouter(ContentNavigationButton);