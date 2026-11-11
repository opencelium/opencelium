import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/index.tsx'
import {registerEntities} from "@/engine/entity/entityRegistration.ts";
import {initEntityI18n} from "@shared/i18n/config/registerEntities.ts";
import {loadRuntimeConfig} from "@shared/config/runtimeConfig";
import '@xyflow/react/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';

registerEntities()
initEntityI18n();

// Fetches /config.json and resolves runtimeConfig.apiUrl/socketUrl before anything else
// runs — every RTK Query/apiExecutor/socket call reads runtimeConfig at call time, so
// this must finish before the app renders and starts firing requests.
await loadRuntimeConfig();

// Mocks run in dev unless explicitly disabled with VITE_ENABLE_MOCKS=false,
// in which case every request goes to the real backend at the configured API_URL
// (see @shared/config/runtimeConfig).
if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
	const { worker } = await import('@/mock/server');
	await worker.start();
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ReactFlowProvider>
			<App />
		</ReactFlowProvider>
	</StrictMode>,
);
