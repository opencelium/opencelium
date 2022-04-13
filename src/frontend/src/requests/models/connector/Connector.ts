export default interface ModelConnector{
    connectorId?: number;
    description: string;
    icon?: string;
    requestData: any;
    sslCert: boolean;
    timeout: number;
    title: string;
}