import type {Invoker} from "@entities/invoker/model/types.ts";

export type Connector = {
  connectorId: number
  title: string
  description: string
  icon?: string | File | null
  invoker: Invoker
  requestData?: Record<string, string>
  sslCert: boolean
  timeout: number
  // Persisted result of the most recent POST /connector/check: null = never tested.
  lastTestPassed?: boolean | null
  lastTestError?: string | null
  // Epoch millis of the last modification, and the id of the user who made it.
  modifiedAt?: number | null
  modifiedBy?: number | null
}

export type ConnectorCreateDto = Omit<Connector, "connectorId" | "invoker" | "timeout"> & {
  invoker: string,
  timeout: string,
}

export type ConnectorUpdateDto = ConnectorCreateDto & {
  connectorId: number,
  // The icon path loaded from the server, kept untouched so the connector PUT can
  // echo it back. ConnectorService.update sets the column unconditionally, so a
  // missing value would clear it (and orphan the file). Real icon changes go
  // through the dedicated POST/DELETE /connector/{id}/icon endpoints instead.
  iconOriginal?: string | null,
}
