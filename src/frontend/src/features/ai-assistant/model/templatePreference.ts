const KEY = 'opencelium:ai:use-templates';

/** Whether workflow builds use the template scripts as examples; kept per browser so a demo setup survives reloads. */
export function readUseTemplates(): boolean {
	try {
		return localStorage.getItem(KEY) !== 'false';
	} catch {
		return true;
	}
}

export function saveUseTemplates(isOn: boolean) {
	try {
		localStorage.setItem(KEY, String(isOn));
	} catch {
		/* Storage may be disabled; the choice then lasts until reload. */
	}
}
