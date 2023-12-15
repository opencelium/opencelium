import {HookStateClass} from "@application/classes/HookStateClass";
import {RootState, useAppSelector} from "@application/utils/store";

export class ModalConnection extends HookStateClass {

    static getReduxState(){
        return useAppSelector((state: RootState) => state.modalConnectionReducer);
    }

}
