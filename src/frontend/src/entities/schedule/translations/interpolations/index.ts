import ScheduleInterpolation from './schedule';
import WebhookInterpolation from './webhook';

export default {
    ...ScheduleInterpolation,
    ...WebhookInterpolation,
}