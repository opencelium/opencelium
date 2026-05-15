import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/index.tsx'
import {registerEntities} from "@/engine/entity/entityRegistration.ts";
import {initEntityI18n} from "@shared/i18n/config/registerEntities.ts";
import '@xyflow/react/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';

registerEntities()
initEntityI18n();

if (import.meta.env.DEV) {
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
