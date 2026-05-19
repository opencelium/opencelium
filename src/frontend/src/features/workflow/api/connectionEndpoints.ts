export const connectionEndpoints = {
	create: '/connection',
	getById: (connectionId: string | number) => `/connection/${connectionId}`,
	update: (connectionId: string | number) => `/connection/${connectionId}`,
	versions: (connectionId: string | number) => `/connection/${connectionId}/versions`,
	version: (connectionId: string | number, snapshotId: string) => `/connection/${connectionId}/version/${snapshotId}`,
};
