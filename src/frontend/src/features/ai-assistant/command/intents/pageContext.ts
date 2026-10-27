/** What the page the user is on adds to a request: "schedule this workflow" in the editor means the open one. */
export type PageContext = { currentWorkflowId?: number };

const WORKFLOW_EDITOR_RE = /^\/workflow\/update\/(\d+)(?:\/|$)/;

export function pageContextOf(pathname: string): PageContext {
	const match = WORKFLOW_EDITOR_RE.exec(pathname);
	return match?.[1] ? { currentWorkflowId: Number(match[1]) } : {};
}
