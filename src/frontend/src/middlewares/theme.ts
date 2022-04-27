import { Middleware } from 'redux'

import {RootState} from "@store/store";
import {LocalStorage} from "@class/application/LocalStorage";
import {setTheme} from '@slice/application/ApplicationSlice';


export const themeMiddleware: Middleware<{}, RootState> = storeApi => next => action => {
    if (setTheme.match(action)) {
        const storage = LocalStorage.getStorage();
        storage.set('theme', action.payload);
    }
    return next(action);
}