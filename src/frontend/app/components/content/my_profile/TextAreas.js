/*
 * Copyright (C) <2021>  <becon GmbH>
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
import {withTranslation} from 'react-i18next';
import SubHeader from "../../general/view_component/SubHeader";
import { Row, Col } from "react-grid-system";

import styles from '@themes/default/content/my_profile/my_profile.scss';
import {connect} from "react-redux";
import {getThemeClass} from "@utils/app";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Detailed information of MyProfile
 */
@connect(mapStateToProps, {})
@withTranslation('users')
class TextAreas extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {t, user, grid, authUser} = this.props;
        let classNames = ['user_details_textareas', 'user_details_textareas_xs', 'user_details_textarea', 'user_details_value'];
        classNames = getThemeClass({classNames, authUser, styles});
        const userDetail = user.userDetail;
        const data = [
            {lang: `${t("VIEW.FIELDS.NAME")}:`, value: `${userDetail.name} ${userDetail.surname}`},
            {lang: `${t("VIEW.FIELDS.PHONE")}:`, value: userDetail.phoneNumber},
            {lang: `${t("VIEW.FIELDS.DEPARTMENT")}:`, value: userDetail.department},
            {lang: `${t("VIEW.FIELDS.ORGANIZATION")}:`, value: userDetail.organisation},
            {lang: `${t("VIEW.FIELDS.USER_TITLE")}:`, value: userDetail.userTitle === 'mr' ? t('TITLE.MR') : t('TITLE.MRS')},
        ];
        let textAreasStyle = styles[classNames.user_details_textareas];
        if(grid === 'xs'){
            textAreasStyle = styles[classNames.user_details_textareas_xs];
        }
        return (
            <Col xs={12} sm={6} md={6} className={textAreasStyle}>
                <SubHeader title={t('VIEW.USER_DETAILS')} authUser={authUser}/>
                {data.map((elem, key) => {
                    return (
                        <Row key={key} className={styles[classNames.user_details_textarea]}>
                            <Col xs={6} md={6}>{elem.lang}</Col>
                            <Col xs={6} md={6} className={styles[classNames.user_details_value]}>{elem.value || '-'}</Col>
                        </Row>
                    );
                })}
            </Col>
        );
    }
}

TextAreas.propTypes = {
    user: PropTypes.object.isRequired,
    grid: PropTypes.string,
};

TextAreas.defaultProps = {
    grid: '',
};


export default TextAreas;