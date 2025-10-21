import {
	ConLogRequestProps,
	DeleteLogsRequest, GetLogListProps, GetLogListResponse,
	IConnectionLogRequest,
	TestConnectionResponse
} from '../interfaces/IConnectionLogRequest';
import Request from "@entity/application/requests/classes/Request";
import {AxiosResponse} from "axios";
import {IResponse} from "@application/requests/interfaces/IResponse";
import {IRequestSettings} from "@application/requests/interfaces/IRequest";
import {
	ConnectionSocketLog,
	DetailedMethodSegment,
	DetailedOperatorSegment,
	Trace
} from "@root/requests/models/ConnectionLog";

export class ConnectionLogRequest extends Request implements IConnectionLogRequest {

	constructor(settings?: Partial<IRequestSettings>) {
		super({url: 'execution', ...settings});
	}
	async getDetailedMethod(data: ConLogRequestProps): Promise<AxiosResponse<ConnectionSocketLog<DetailedMethodSegment>>> {
		this.endpoint = `/log/element/${data.id}/details`;
		return super.get<ConnectionSocketLog<DetailedMethodSegment>>();
	}

	async getDetailedOperator(data: ConLogRequestProps): Promise<AxiosResponse<ConnectionSocketLog<DetailedOperatorSegment>>> {
		this.endpoint = `/log/element/${data.id}/details`;
		return super.get<ConnectionSocketLog<DetailedOperatorSegment>>();
	}

	async getOperatorChildren(data: ConLogRequestProps): Promise<AxiosResponse<Trace[]>> {
		const params = data.loopIndex && data.loopIndex.length > 0 ? `?loopIndex=${data.loopIndex[data.loopIndex.length - 1]}` : '';
		this.endpoint = `/log/element/${data.id}/children${params}`;
		return super.get<Trace[]>();
	}

	async getFlowCharts(executionId: string): Promise<AxiosResponse<Trace[]>> {
		this.endpoint = `/log/element/${executionId}/children`;
		return super.get<Trace[]>();
	}

	async getFirstLevelLogs(flowChartId: string): Promise<AxiosResponse<Trace[]>> {
		this.endpoint = `/log/element/${flowChartId}/children`;
		return super.get<Trace[]>();
	}

	async deleteLogs(data: DeleteLogsRequest): Promise<AxiosResponse<IResponse>> {
		this.endpoint = `/${data.executionId}`;
		return super.delete<IResponse>();
	}

	async testConnection(connection: any): Promise<AxiosResponse<TestConnectionResponse>> {
		this.url = 'connection';
		return super.post<TestConnectionResponse>(connection);
	}

	async getLogList({connectionId, status, schedulerId}: GetLogListProps): Promise<AxiosResponse<GetLogListResponse>> {
		this.url = 'execution';
		const args = `connectionId=${connectionId}&schedulerId=${schedulerId}&status=${status}`;
		this.endpoint = `/log-files?${args}`;
		return super.get<GetLogListResponse>();
	}
}
