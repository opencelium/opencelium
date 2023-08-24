import {RootState, useAppSelector} from "@application/utils/store";

export default class CheckConnection{

    static getReduxState(){
        return useAppSelector((state: RootState) => state.checkConnectionReducer);
    }
}
