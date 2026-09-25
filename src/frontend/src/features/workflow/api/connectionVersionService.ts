import type { ConnectionVersionResource, HistoryVersionItem } from '../types/history.types';
import {
	deleteConnectionVersion,
	getConnectionVersions,
	updateConnectionVersion,
} from './connectionApi';

const normalizeVersion = (
	version: ConnectionVersionResource,
	fallbackIndex: number,
): HistoryVersionItem => {
	const snapshotId = version.snapshotId || String(version.connectionId ?? fallbackIndex);
	return {
		id: snapshotId,
		snapshotId,
		createdAt: typeof version.createdAt === 'number' ? version.createdAt : Date.now(),
		author: String(version.author ?? 'Unknown'),
		comment: version.comment ?? '',
		current: Boolean(version.current ?? version.isCurrent),
	};
};

export async function loadConnectionVersions(connectionId: string | number): Promise<HistoryVersionItem[]> {
	const response = await getConnectionVersions(connectionId);
	const versions = Array.isArray(response.data) ? response.data : [];
	return versions.map(normalizeVersion).sort((left, right) => right.createdAt - left.createdAt);
}

export async function saveConnectionVersionComment(
	connectionId: string | number,
	snapshotId: string,
	comment: string,
) {
	await updateConnectionVersion(connectionId, snapshotId, { comment });
}

export async function removeConnectionVersion(connectionId: string | number, snapshotId: string) {
	await deleteConnectionVersion(connectionId, snapshotId);
}
