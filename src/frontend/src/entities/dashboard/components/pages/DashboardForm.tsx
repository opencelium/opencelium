/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useRef, useState} from 'react';
import {ReactGridLayoutProps} from "react-grid-layout";
import {withTheme} from 'styled-components';
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {resizeWindow} from "@application/utils/utils";
import {ColorTheme} from "@style/Theme";
import Button from "@app_component/base/button/Button";
import {
    getAllWidgetSettings,
    updateAllWidgetSettings
} from "../../redux_toolkit/action_creators/WidgetSettingCreators";
import {getAllWidgets} from "../../redux_toolkit/action_creators/WidgetCreators";
import {Widget} from "../../classes/Widget";
import {WidgetSetting} from "../../classes/WidgetSetting";
import {IWidgetSetting} from "../../interfaces/IWidgetSetting";
import {ConnectionOverviewWidget} from "../widgets/ConnectionOverviewWidget";
import {MonitoringBoardsWidget} from "../widgets/MonitoringBoardsWidget";
import {CurrentSchedulesWidget} from "../widgets/CurrentSchedulesWidget";
import DashboardToolbox from "../dashboard_toolbox/DashboardToolbox";
import {DashboardFormProps} from './interfaces';
import {
    DashboardFormStyled,
    DashboardViewStyled,
    ReactGridLayoutStyled,
    RemoveButtonStyled,
    TitleStyled,
    WidgetItemStyled
} from './styles';
import Socket from '@application/classes/Socket';
import { Auth } from '@application/classes/Auth';
import { Connection } from '@entity/connection/classes/Connection';
import {addCurrentLog} from "@root/redux_toolkit/slices/ConnectionSlice";

export const HAS_DASHBOARD_WIDGET_ENGINE = true;

export const WIDGET_LIST = {
    'MONITORING_BOARDS': <MonitoringBoardsWidget/>,
    'CURRENT_SCHEDULER': <CurrentSchedulesWidget/>,
    'CONNECTION_OVERVIEW': <ConnectionOverviewWidget/>,
}

const DashboardForm: FC<DashboardFormProps> =
    ({
     }) => {
        /*
        * TODO: implement get subscription update
        */
        const dispatch = useAppDispatch();
        const {authUser} = Auth.getReduxState();
        const {widgets, gettingAllWidgets} = Widget.getReduxState();
        const {gettingAllWidgetSettings, updatingAllWidgetSettings, widgetSettings} = WidgetSetting.getReduxState();
        const [isWidgetEditOn, setIsWidgetEditOn] = useState<boolean>(false);
        const [currentWidget, setCurrentWidget] = useState(null);
        const [layout, setLayout] = useState<IWidgetSetting[]>([]);
        const [toolbox, setToolbox] = useState([]);

        useEffect(() => {
            dispatch(getAllWidgets());
            dispatch(getAllWidgetSettings());
        }, [])
        useEffect(() => {
            let newLayout = widgetSettings.map(item => {
                let initial = widgets.find(initialItem => initialItem.i === item.i);
                if(initial){
                    return {
                        ...initial,
                        ...item,
                    };
                } else{
                    return item;
                }
            });
            let newToolbox = widgets.filter(initialItem => {
                let itemIndex = widgetSettings.findIndex(item => item.i === initialItem.i);
                return itemIndex === -1;
            });
            setLayout(newLayout);
            setToolbox(newToolbox);
            resizeWindow();
        }, [widgets, widgetSettings])
        const toggleWidgetEdit = () => {
            setIsWidgetEditOn(!isWidgetEditOn);
        }
        const onTakeItem = (item: any) => {
            const newToolbox = [
                ...toolbox.filter(({ i }) => i !== item.i),
            ];
            const newLayout = [
                ...layout,
                item
            ]
            setToolbox(newToolbox);
            setLayout(newLayout);
            setCurrentWidget(item);
        }
        const onPutItem = (item: any) => {
            const newToolbox = [
                ...toolbox,
                item
            ];
            const newLayout = [
                ...layout.filter(({ i }) => i !== item.i),
            ];
            setToolbox(newToolbox);
            setLayout(newLayout);
            setCurrentWidget(item);
        }
        const onLayoutChange = (comingLayout: any) => {
            let newLayout = layout;
            for(let i = 0; i < newLayout.length; i++){
                let findLayout = comingLayout.find((l: any) => l.i === newLayout[i].i);
                if(findLayout){
                    newLayout[i] = {...newLayout[i], ...findLayout};
                }
            }
            setLayout(newLayout);
            dispatch(updateAllWidgetSettings(newLayout))
        }
        const getWidgets = () => {
            return layout.map(layout => {
                return (
                    <WidgetItemStyled key={layout.i} isWidgetEditOn={isWidgetEditOn}>
                        {isWidgetEditOn &&
                            <RemoveButtonStyled
                                size={20}
                                hasBackground={false}
                                color={ColorTheme.Black}
                                icon={updatingAllWidgetSettings === API_REQUEST_STATE.START && currentWidget && currentWidget.i === layout.i ? 'loading' : 'close'}
                                handleClick={() => onPutItem(layout)}
                            />
                        }
                        {WIDGET_LIST.hasOwnProperty(layout.i) && WIDGET_LIST[layout.i]}
                    </WidgetItemStyled>
                );
            });
        }
        let gridSettings: ReactGridLayoutProps = {
            className: `layout`,
            rowHeight: 100,
            width: 1200,
            isBounded: true,
            isDraggable: false,
            isResizable: false,
            layout,
            onLayoutChange,
        };
        if(isWidgetEditOn){
            gridSettings.isDraggable = true;
            gridSettings.isResizable = true;
        }
        const EditDashboardIcon = HAS_DASHBOARD_WIDGET_ENGINE && <Button hasBackground={false} iconSize={'16px'} color={ColorTheme.Gray} icon={isWidgetEditOn ? 'check_circle_outline' : 'edit'} handleClick={toggleWidgetEdit}/>;
        return (
            <DashboardFormStyled>
                <TitleStyled title={'Dashboard'} icon={EditDashboardIcon}/>
                <DashboardViewStyled>
                    <div>
                        {isWidgetEditOn &&
                            <DashboardToolbox
                                items={toolbox || []}
                                onTakeItem={onTakeItem}
                            />
                        }
                        <ReactGridLayoutStyled isWidgetEditOn={isWidgetEditOn} isLayoutEmpty={layout.length === 0} {...gridSettings}>
                            {getWidgets()}
                        </ReactGridLayoutStyled>
                    </div>
                </DashboardViewStyled>
            </DashboardFormStyled>
        )
    }

DashboardForm.defaultProps = {
}


export {
    DashboardForm,
};

export default withTheme(DashboardForm);