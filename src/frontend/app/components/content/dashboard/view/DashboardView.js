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
    WIDGET_LIST
} from "@components/content/dashboard/view/settings";
import DashboardToolbox from "@components/content/dashboard/view/DashboardToolbox";
import {fetchWidgetSettings, fetchWidgets, fetchWidgetsRejected} from "@actions/dashboard/fetch";
import {updateWidgetSettings} from "@actions/dashboard/update";
import {ListComponent} from "@decorators/ListComponent";

const ReactGridLayout = WidthProvider(RGL);

function mapStateToProps(state){
    const auth = state.get('auth');
    const updateAssistant = state.get('update_assistant');
    const dashboard = state.get('dashboard');
    return {
        authUser: auth.get('authUser'),
        fetchingUpdateAppVersion: updateAssistant.get('fetchingUpdateAppVersion'),
        settings: dashboard.get('settings'),
        updatingWidgetSettings: dashboard.get('updatingWidgetSettings'),
        fetchingWidgets: dashboard.get('fetchingWidgets'),
        currentWidget: dashboard.get('currentWidget'),
        layout: dashboard.get('layout').toJS(),
        toolbox: dashboard.get('toolbox').toJS(),
    };
}

/**
 * Dashboard component
 * Important! schedules and app translations should be imported already here
 */
@connect(mapStateToProps, {fetchUpdateAppVersion, fetchWidgetSettings, updateWidgetSettings, fetchWidgets, fetchWidgetsRejected})
@withTranslation(['dashboard', 'schedules', 'app'])
@ListComponent('widgets', true)
class DashboardView extends Component{

    constructor(props){
        super(props);

        this.state = {
            isWidgetEditOn: false,
        }
    }

    componentDidMount() {
        const {fetchingUpdateAppVersion, fetchUpdateAppVersion, fetchWidgetSettings} = this.props;
        if(fetchingUpdateAppVersion !== API_REQUEST_STATE.START) {
            fetchUpdateAppVersion();
        }
        fetchWidgetSettings();
        componentAppear('app_content');
    }

    toggleWidgetEdit(){
        this.setState({
            isWidgetEditOn: !this.state.isWidgetEditOn,
        });
    }

    onTakeItem(e, item){
        const toolbox = [
            ...this.props.toolbox.filter(({ i }) => i !== item.i),
        ];
        const layout = [
            ...this.props.layout,
            item
        ]
        this.props.updateWidgetSettings({currentWidget: item, settings: {widgetSettings: layout}, toolbox, layout});
    };

    onPutItem(e, item){
        const toolbox = [
            ...this.props.toolbox,
            item
        ];
        const layout = [
            ...this.props.layout.filter(({ i }) => i !== item.i),
        ];
        this.props.updateWidgetSettings({currentWidget: item, settings: {widgetSettings: layout}, toolbox, layout});
    };

    onLayoutChange(layout){
        const {toolbox} = this.props;
        let updatedLayout = this.props.layout;
        for(let i = 0; i < updatedLayout.length; i++){
            let findLayout = layout.find(l => l.i === updatedLayout[i].i);
            if(findLayout){
                updatedLayout[i] = {...updatedLayout[i], ...findLayout};
            }
        }
        this.props.updateWidgetSettings({settings: {widgetSettings: updatedLayout}, toolbox, layout: updatedLayout});
    };

    renderWidgets(){
        const {isWidgetEditOn} = this.state;
        const {layout, currentWidget, updatingWidgetSettings} = this.props;
        return layout.map(layout => {
            return (
                <div key={layout.i} className={`${styles.dashboard_widget_item} ${isWidgetEditOn && styles.dashboard_widget_item_edit_on}`}>
                    {isWidgetEditOn &&
                        <TooltipFontIcon size={20} isButton={true} tooltip={'Close'} value={updatingWidgetSettings === API_REQUEST_STATE.START && currentWidget && currentWidget.i === layout.i ? 'loading' : 'close'} className={styles.close_widget} onClick={(e) => ::this.onPutItem(e, layout)}/>
                    }
                    {WIDGET_LIST.hasOwnProperty(layout.i) && WIDGET_LIST[layout.i]}
                </div>
            );
        });
    }

    render(){
        const {isWidgetEditOn} = this.state;
        const {layout, toolbox} = this.props;
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