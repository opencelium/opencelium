import {RootState, useAppSelector} from "@application/utils/store";
import SubscriptionModel from "@entity/application/requests/models/SubscriptionModel";
import {convertTimeForSubscription} from "@application/utils/utils";

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

    static getMonthlyPeriod(comingDate: number): string {
        const date = new Date(comingDate);
        const inputDay = date.getDate();
        console.log(inputDay);
        // End date is one day before the input day, same month and year as today
        const todayDate = new Date();
        const inputTodayDay = todayDate.getDate();
        const inputTodayMonth = todayDate.getMonth(); // zero-indexed (0 = January, 11 = December)
        const inputTodayYear = todayDate.getFullYear();

        // Start date is one month before the end date
        const startDate = new Date();
        startDate.setDate(inputDay);
        startDate.setFullYear(inputTodayYear);
        let endDate = new Date();
        if (inputDay === 1) {
            startDate.setMonth( inputTodayMonth);
            endDate = new Date(inputTodayYear, inputTodayMonth + 1, 0)
        } else {
            startDate.setMonth( inputTodayMonth - 1);
            endDate.setFullYear(inputTodayYear);
            endDate.setMonth(inputTodayMonth);
            endDate.setDate(inputDay - 1);
            if (inputDay <= inputTodayDay) {
                startDate.setMonth(inputTodayMonth);
                endDate.setMonth(inputTodayMonth + 1);
            }
        }
        const leftDate = convertTimeForSubscription(startDate, {hasHours: false, hasMinutes: false, hasSeconds: false})
        const rightDate = convertTimeForSubscription(endDate, {hasHours: false, hasMinutes: false, hasSeconds: false})
        return `${leftDate} - ${rightDate}`;
    }
}
