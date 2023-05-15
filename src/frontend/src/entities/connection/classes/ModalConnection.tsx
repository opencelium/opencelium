import {HookStateClass} from "@application/classes/HookStateClass";
import {RootState} from "@application/utils/store";

export class ModalConnection extends HookStateClass {

    static createState<T>():T{
        return super.createState<any>(ModalConnection, (state: RootState) => state.modalConnectionReducer);
    }

}
