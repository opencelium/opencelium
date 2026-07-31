import type {Invoker} from "@entities/invoker/model/types.ts";

export type ConnectorHealthStatus = 'UP' | 'AUTH_FAILED' | 'DOWN' | 'UNKNOWN'

// Server-side health check result, shared by the full Connector fetch and the
// lightweight ConnectorMetaDTO snapshot. lastCheckedAt is epoch millis of the last check.
export type ConnectorHealth = {
  status: ConnectorHealthStatus
  lastTestError: string | null
  lastCheckedAt: number | null
}

export type Connector = {
  connectorId: number
  title: string
  description: string
  icon?: string | File | null
  invoker: Invoker
  requestData?: Record<string, string>
  sslCert: boolean
  timeout: number
  // Epoch millis of the last modification, and the id of the user who made it.
  modifiedAt?: number | null
  modifiedBy?: number | null
} & ConnectorHealth

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

// Lightweight snapshot served by GET /connector/meta/all for list/status display —
// cheaper server-side than /connector/all since it skips credential decryption.
// No description/requestData: use the full Connector fetch when those are needed.
export type ConnectorMetaDTO = {
  connectorId: number
  title: string
  icon: string | null
  sslCert: boolean
  timeout: number
  invoker: { name: string }
} & ConnectorHealth
