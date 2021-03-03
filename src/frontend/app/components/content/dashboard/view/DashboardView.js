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
import {connect} from "react-redux";
import {withTranslation} from 'react-i18next';
import RGL, {WidthProvider} from "react-grid-layout";
import styles from '@themes/default/content/dashboard/dashboard.scss';
import {componentAppear, getThemeClass} from "@utils/app";
import {API_REQUEST_STATE} from "@utils/constants/app";
import {fetchUpdateAppVersion} from "@actions/update_assistant/fetch";
import {Col, Container, Row} from "react-grid-system";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {
    HAS_DASHBOARD_WIDGET_ENGINE,
    INITIAL_LAYOUT,
    INITIAL_TOOLBOX,
    WIDGET_LIST
} from "@components/content/dashboard/view/settings";
import DashboardToolbox from "@components/content/dashboard/view/DashboardToolbox";
const ReactGridLayout = WidthProvider(RGL);


function mapStateToProps(state){
    const updateAssistant = state.get('update_assistant');
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
        fetchingUpdateAppVersion: updateAssistant.get('fetchingUpdateAppVersion'),
    };
}


/**
 * Dashboard component
 * Important! schedules and app translations should be imported already here
 */
@connect(mapStateToProps, {fetchUpdateAppVersion})
@withTranslation(['dashboard', 'schedules', 'app'])
class DashboardView extends Component{

    constructor(props){
        super(props);

        this.state = {
            isWidgetEditOn: false,
            layout: INITIAL_LAYOUT,
            toolbox: INITIAL_TOOLBOX
        }
    }

    componentDidMount() {
        const {fetchingUpdateAppVersion, fetchUpdateAppVersion} = this.props;
        if(fetchingUpdateAppVersion !== API_REQUEST_STATE.START) {
            fetchUpdateAppVersion();
        }
        componentAppear('app_content');
    }

    toggleWidgetEdit(){
        this.setState({
            isWidgetEditOn: !this.state.isWidgetEditOn,
        });
    }

    onTakeItem(e, item){
        this.setState(prevState => ({
            toolbox: [
                ...prevState.toolbox.filter(({ i }) => i !== item.i),
            ],
            layout: [
                ...prevState.layout,
                item
            ]
        }));
    };

    onPutItem(e, item){
        this.setState(prevState => {
            return {
                toolbox: [
                    ...prevState.toolbox,
                    item
                ],
                layout: [
                    ...prevState.layout.filter(({ i }) => i !== item.i),
                ]
            };
        });
    };

    onLayoutChange(layout){
        this.setState(prevState => {
            let updatedLayout = prevState.layout;
            for(let i = 0; i < updatedLayout.length; i++){
                let findLayout = layout.find(l => l.i === updatedLayout[i].i);
                if(findLayout){
                    updatedLayout[i] = {...updatedLayout[i], ...findLayout};
                }
            }
            return {
                layout: updatedLayout,
            };
        });
    };

    renderWidgets(){
        const {layout, isWidgetEditOn} = this.state;
        return layout.map(layout => {
            return (
                <div key={layout.i} className={`${styles.dashboard_widget_item} ${isWidgetEditOn && styles.dashboard_widget_item_edit_on}`}>
                    {isWidgetEditOn &&
                        <TooltipFontIcon size={20} isButton={true} tooltip={'Close'} value={'close'} className={styles.close_widget} onClick={(e) => ::this.onPutItem(e, layout)}/>
                    }
                    {WIDGET_LIST.hasOwnProperty(layout.i) && WIDGET_LIST[layout.i]}
                </div>
            );
        });
    }

    render(){
        const {isWidgetEditOn, layout, toolbox} = this.state;
        let gridSettings = {
            className: `layout`,
            cols: 12,
            rowHeight: 100,
            width: 1200,
            isBounded: true,
            isDraggable: false,
            isResizable: false,
            layout,
            onLayoutChange: ::this.onLayoutChange,
        };
        if(isWidgetEditOn){
            gridSettings.className += ` ${styles.dashboard_grid_edit_on}`;
            gridSettings.isDraggable = true;
            gridSettings.isResizable = true;
        }
        if(layout.length === 0){
            gridSettings.className += ` ${styles.dashboard_no_widgets}`;
        }
        return (
            <Row id={'app_content'}>
                <Col xl={12} lg={12} md={12} sm={12}>
                    <Container className={styles.dashboard_view}>
                        {HAS_DASHBOARD_WIDGET_ENGINE && <TooltipFontIcon isButton={true} wrapClassName={styles.dashboard_edit_icon} tooltip={isWidgetEditOn ? 'Apply' : 'Edit'} value={isWidgetEditOn ? 'check_circle_outline' : 'edit'} onClick={::this.toggleWidgetEdit}/>}
                        <Row style={{ marginLeft: 0, marginRight: 0}}>
                            <Col md={12}>
                                {isWidgetEditOn &&
                                <DashboardToolbox
                                    items={toolbox || []}
                                    onTakeItem={::this.onTakeItem}
                                />
                                }
                                <ReactGridLayout {...gridSettings}>
                                    {::this.renderWidgets()}
                                </ReactGridLayout>
                            </Col>
                        </Row>
                    </Container>
                </Col>
            </Row>
        );
    }
}


export default DashboardView;