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

import styled from "styled-components";
import WidgetTitle from "../widget_title/WidgetTitle";
import {DefaultCardShadowStyles, DefaultShadowHoverStyles} from "@entity/application/utils/constants";

const CurrentSchedulesWidgetStyled = styled.div`
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    ${DefaultCardShadowStyles}
    ${DefaultShadowHoverStyles}
`;

const ConnectionOverviewWidgetStyled = styled.div`
    height: 100%;
    position: relative;
    :first-child:first-child:focus{
        outline: none !important;
    }
    ${DefaultCardShadowStyles}
    ${DefaultShadowHoverStyles}
`;

const ConnectionOverviewTitle = styled(WidgetTitle)`
    position: absolute;
    margin: 15px;
`;

const MonitoringBoardsWidgetStyled = styled.div`
    padding: 1vw 1vw 0.5vw;
    background-color: #fff;
    ${DefaultCardShadowStyles}
    ${DefaultShadowHoverStyles}
    height: calc(100% - 55px);
    max-width: 100%;
    &>iframe{
        border: none;
        width: 100%;
        height: calc(100% - 50px) !important;
    }
`;

const SubscriptionOverviewWidgetStyled = styled.div`
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    height: 100%;
    width: 100%;
    padding: 1vw 1.5vw 0.5vw 1vw;
    background-color: #fff;
    ${DefaultCardShadowStyles}
    ${DefaultShadowHoverStyles}
`;

const DashboardMetricsOverviewWidgetStyled = styled.div`
	width: 100%;
	height: 100%;
	padding: 15px;
	background: #fff;

	${DefaultCardShadowStyles}
	${DefaultShadowHoverStyles}
    display: flex;
	flex-direction: column;
	gap: 10px;
`;

const MetricsCardHeaderStyled = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #666;
    margin-top: 15px;
`;

const MetricsGridStyled = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: repeat(8, minmax(120px, 1fr));
	border: 1px solid rgba(0, 0, 0, 0.12);
	border-radius: 2px;
	overflow: hidden;

	@media (max-width: 1400px) {
		grid-template-columns: repeat(4, minmax(160px, 1fr));
	}

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, minmax(160px, 1fr));
	}
`;

const MetricCellStyled = styled.div`
	min-height: 92px;
	padding: 12px 10px;
	background: #fff;

	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 10px;

	border-right: 1px solid rgba(0, 0, 0, 0.12);
	border-bottom: 1px solid rgba(0, 0, 0, 0.12);

	&:nth-child(8n) {
		border-right: none;
	}

	@media (max-width: 1400px) {
		&:nth-child(4n) {
			border-right: none;
		}
	}

	@media (max-width: 900px) {
		&:nth-child(2n) {
			border-right: none;
		}
	}
`;

const MetricLabelStyled = styled.div`
	font-size: 12px;
	color: #666;
	text-align: center;
	line-height: 1.2;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const MetricValueStyled = styled.div`
	font-size: 22px;
	font-weight: 700;
	color: #111;
	text-align: center;
`;

export {
    CurrentSchedulesWidgetStyled,
    ConnectionOverviewWidgetStyled,
    ConnectionOverviewTitle,
    MonitoringBoardsWidgetStyled,
    SubscriptionOverviewWidgetStyled,
    MetricCellStyled,
    MetricLabelStyled,
    MetricValueStyled,
    DashboardMetricsOverviewWidgetStyled,
    MetricsGridStyled,
    MetricsCardHeaderStyled
}
