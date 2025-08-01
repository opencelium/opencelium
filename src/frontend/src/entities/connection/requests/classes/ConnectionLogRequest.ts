import {
	ConLogRequestProps,
	DeleteLogsRequest,
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
		const params = data.loopIndex ? `?loopIndex=${data.loopIndex.join(',')}` : '';
		this.endpoint = `/${data.executionId}/flow/${data.flowId}/indexPath/${data.indexPath}/detailed/${params}`;
		return super.get<ConnectionSocketLog<DetailedMethodSegment>>();
	}

	async getDetailedOperator(data: ConLogRequestProps): Promise<AxiosResponse<ConnectionSocketLog<DetailedOperatorSegment>>> {
		const params = data.loopIndex ? `?loopIndex=${data.loopIndex.join(',')}` : '';
		this.endpoint = `/${data.executionId}/flow/${data.flowId}/indexPath/${data.indexPath}/detailed/${params}`;
		return super.get<ConnectionSocketLog<DetailedOperatorSegment>>();
	}

	async getOperatorChildren(data: ConLogRequestProps): Promise<AxiosResponse<Trace[]>> {
		const params = data.loopIndex ? `?loopIndex=${data.loopIndex.join(',')}` : '';
		this.endpoint = `/${data.executionId}/flow/${data.flowId}/indexPath/${data.indexPath}/children/${params}`;
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
}
