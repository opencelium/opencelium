export const connectionEndpoints = {
	create: '/connection',
	getById: (connectionId: string | number) => `/connection/${connectionId}`,
	update: (connectionId: string | number) => `/connection/${connectionId}`,
};
