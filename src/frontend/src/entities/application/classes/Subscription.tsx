import {RootState, useAppSelector} from "@application/utils/store";
import SubscriptionModel from "@entity/application/requests/models/SubscriptionModel";

export default class Subscription {

    static getReduxState(){
        return useAppSelector((state: RootState) => state.subscriptionReducer);
    }

    static getOptions(subscriptions: SubscriptionModel[]) {
        return subscriptions.map(s => {
            return {
                label: s.type,
                value: s._id,
            }
        })
    }
}
