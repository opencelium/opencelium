import { baseApi } from '@shared/api/baseApi';
import type { PlaygroundRequest, PlaygroundResponse } from './playground.types';

export const PLAYGROUND_URL = '/connection/method/test';

export const playgroundApi = baseApi.injectEndpoints({
	endpoints: (b) => ({
		sendPlaygroundRequest: b.mutation<PlaygroundResponse, PlaygroundRequest>({
			query: (body) => ({ url: PLAYGROUND_URL, method: 'POST', body }),
		}),
	}),
});

export const { useSendPlaygroundRequestMutation } = playgroundApi;
