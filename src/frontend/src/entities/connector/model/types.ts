import type {Invoker} from "@entities/invoker/model/types.ts";

export type Connector = {
  connectorId: number
  title: string
  description: string
  invoker: Invoker
  requestData?: Record<string, string>
  sslCert: boolean
  timeout: number
}

export type ConnectorCreateDto = Omit<Connector, "connectorId" | "invoker" | "timeout"> & {
  invoker: string,
  timeout: string,
}

export type ConnectorUpdateDto = ConnectorCreateDto & {
  connectorId: number,
}
