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

import React, { FC, useMemo } from 'react';
import {
	DashboardMetricsOverviewWidgetStyled,
	MetricsCardHeaderStyled,
	MetricsGridStyled,
	MetricCellStyled,
	MetricLabelStyled,
	MetricValueStyled,
} from './styles';

type MetricKey =
	| 'executions'
	| 'failed_executions'
	| 'failed_execution_percent'
	| 'run_time'
	| 'avg_run_time'
	| 'cpu_usage'
	| 'memory_usage'
	| 'generated_logs';

interface IMetric {
	key: MetricKey;
	label: string;
	value: string;
}

interface IStats {
	periodDays: number;
	metrics: IMetric[];
}

const DashboardMetricsOverviewWidget: FC = () => {
	const stats = useMemo<IStats>(
		() => ({
			periodDays: 7,
			metrics: [
				{ key: 'executions', label: 'Executions', value: '503' },
				{ key: 'failed_executions', label: 'Failed executions', value: '103' },
				{ key: 'failed_execution_percent', label: 'Failed execution %', value: '21%' },
				{ key: 'run_time', label: 'Run time', value: '1.124 h' },
				{ key: 'avg_run_time', label: 'Run time Ø', value: '33 min' },
				{ key: 'cpu_usage', label: 'CPU usage %', value: '15%' },
				{ key: 'memory_usage', label: 'Memory usage', value: '3.23/4 GB' },
				{ key: 'generated_logs', label: 'Generated Logs', value: '4,23 GB' },
			],
		}),
		[],
	);

	return (
		<DashboardMetricsOverviewWidgetStyled>
			<MetricsCardHeaderStyled>
				Overview last {stats.periodDays} days
			</MetricsCardHeaderStyled>

			<MetricsGridStyled>
				{stats.metrics.map((m) => (
					<MetricCellStyled key={m.key}>
						<MetricLabelStyled title={m.label}>{m.label}</MetricLabelStyled>
						<MetricValueStyled>{m.value}</MetricValueStyled>
					</MetricCellStyled>
				))}
			</MetricsGridStyled>
		</DashboardMetricsOverviewWidgetStyled>
	);
};

export { DashboardMetricsOverviewWidget };
