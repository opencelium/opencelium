import * as AddActions from './add';
import * as CheckActions from './check';
import * as DeleteActions from './delete';
import * as FetchActions from './fetch';
import * as UpdateActions from './update';

export default {
    ...AddActions,
    ...CheckActions,
    ...DeleteActions,
    ...FetchActions,
    ...UpdateActions,
}