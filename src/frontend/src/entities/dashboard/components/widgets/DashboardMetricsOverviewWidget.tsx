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

import React, {FC, useEffect, useMemo, useState} from 'react';
import {
	DashboardMetricsOverviewWidgetStyled,
	MetricsCardHeaderStyled,
	MetricsGridStyled,
	MetricCellStyled,
	MetricLabelStyled,
	MetricValueStyled,
} from './styles';
import {useAppDispatch} from "@application/utils/store";
import {getMetrics} from "@entity/dashboard/redux_toolkit/action_creators/WidgetCreators";
import {Widget} from "@entity/dashboard/classes/Widget";
import {Loading} from "@app_component/base/loading/Loading";
import {useSocketData} from "../../../../socket/SocketDataContext";
function formatDuration(milliseconds: number): string {
	const seconds = milliseconds / 1000;
	if (seconds >= 3600) {
		return `${(seconds / 3600).toFixed(3)} h`;
	}

	if (seconds >= 60) {
		return `${Math.floor(seconds / 60)} min`;
	}

	return `${Math.floor(seconds)} sec`;
}
function calculateClampedPercentage(total: number, value: number): number {
	if (total <= 0) return 0;

	if (value <= 0) return 0;
	if (value >= total) return 100;

	const percentage = Math.round((value / total) * 100);

	return Math.min(99, Math.max(1, percentage));
}
function formatKilobytes(kb: number): string {
	const MB = 1024;
	const GB = 1024 * 1024;

	if (kb < 1) {
		return '< 1 KB';
	}

	if (kb < MB) {
		return `${Math.floor(kb)} KB`;
	}

	if (kb < GB) {
		const mb = kb / MB;
		return `${mb.toFixed(2).replace('.', ',')} MB`;
	}

	const gb = kb / GB;
	return `${gb.toFixed(2).replace('.', ',')} GB`;
}

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
	const dispatch = useAppDispatch();
	const {systemMetrics: metrics} = useSocketData();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const stats = useMemo<IStats>(
		() => {
			const failedExecPerc = metrics?.total_failed_execs && metrics?.total_execs ? calculateClampedPercentage(metrics.total_failed_execs, metrics.total_execs) : '-';
			const runtime = metrics?.total_runtime ? formatDuration(metrics.total_runtime) : '-';
			const avgRuntime = metrics?.avg_runtime_s ? formatDuration(metrics.avg_runtime_s) : '-';
			return {
				periodDays: 7,
				metrics: [
					{ key: 'executions', label: 'Executions', value: `${metrics?.total_execs || '-'}` },
					{ key: 'failed_executions', label: 'Failed executions', value: `${metrics?.total_failed_execs || '-'}` },
					{ key: 'failed_execution_percent', label: 'Failed execution %', value: `${failedExecPerc}${failedExecPerc !== '-' ? '%' : ''}`},
					{ key: 'run_time', label: 'Run time', value: runtime},
					{ key: 'avg_run_time', label: 'Run time Ø', value: avgRuntime },
					{ key: 'cpu_usage', label: 'CPU usage %', value: `${metrics?.cpu_usage || '-'}${metrics ? '%' : ''}` },
					{ key: 'memory_usage', label: 'Memory usage', value: `${metrics?.memory_usage ? formatKilobytes(metrics.memory_usage) : '-'}` },
					{ key: 'generated_logs', label: 'Generated Logs', value: `${metrics?.exec_log_size ? formatKilobytes(metrics.exec_log_size) : '-'}` },
				],
			}
		},
		[metrics],
	);
	useEffect(() => {
		(async () => {
			try {
				dispatch(getMetrics());
			} catch (e) {

			} finally {
				setIsLoading(false);
			}
		})()
	}, []);

	return (
		<DashboardMetricsOverviewWidgetStyled>
			<MetricsCardHeaderStyled>
				Overview last {stats.periodDays} days
			</MetricsCardHeaderStyled>

			<MetricsGridStyled>
				{stats.metrics.map((m) => (
					<MetricCellStyled key={m.key}>
						<MetricLabelStyled title={m.label}>{m.label}</MetricLabelStyled>
						<MetricValueStyled>{isLoading ? <Loading/> : m.value}</MetricValueStyled>
					</MetricCellStyled>
				))}
			</MetricsGridStyled>
		</DashboardMetricsOverviewWidgetStyled>
	);
};

export { DashboardMetricsOverviewWidget };
