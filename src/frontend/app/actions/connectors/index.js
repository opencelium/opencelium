import * as AddActions from './add';
import * as DeleteActions from './delete';
import * as FetchActions from './fetch';
import * as TestActions from './test';
import * as UpdateActions from './update';

export default {
    ...AddActions,
    ...DeleteActions,
    ...FetchActions,
    ...TestActions,
    ...UpdateActions,
}