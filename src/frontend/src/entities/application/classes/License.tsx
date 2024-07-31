import {RootState, useAppSelector} from "@application/utils/store";

export default class License {

    static getReduxState(){
        return useAppSelector((state: RootState) => state.licenseReducer);
    }
}
