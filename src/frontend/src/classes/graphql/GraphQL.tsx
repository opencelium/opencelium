import {useAppSelector} from "../../hooks/redux";
import {RootState} from "@store/store";

export class GraphQL{
    static getReduxState() {
        return useAppSelector((state: RootState) => state.graphQLReducer);
    }
}