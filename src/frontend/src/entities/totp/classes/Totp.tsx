import {RootState, useAppSelector} from "@application/utils/store";
export default class Totp {

    static getReduxState(){
        return useAppSelector((state: RootState) => state.totpReducer);
    }
}
