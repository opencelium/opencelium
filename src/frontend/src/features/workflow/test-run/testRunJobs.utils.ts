const TEST_SCHEDULE_TITLE_PREFIX = '!*test_schedule_';

export type RunningJob = { schedulerId: number; title?: string };

const isConflictingTest = (job: RunningJob, connectionTitle: string) =>
	typeof job?.title === 'string' &&
	job.title.startsWith(TEST_SCHEDULE_TITLE_PREFIX) &&
	job.title.endsWith(connectionTitle);

export const hasConflictingTest = (
	jobs: unknown,
	connectionTitle: string,
	excludeSchedulerId: number | null,
) => !!connectionTitle && Array.isArray(jobs) && jobs.some((job) =>
	isConflictingTest(job as RunningJob, connectionTitle) &&
	(job as RunningJob).schedulerId !== excludeSchedulerId);

export const isOwnJobListed = (jobs: unknown, schedulerId: number | null) =>
	schedulerId != null && Array.isArray(jobs) && jobs.some((job) =>
		(job as RunningJob)?.schedulerId === schedulerId);
