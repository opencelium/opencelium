import {RootState, useAppSelector} from "@application/utils/store";
import {convertTimeForSubscription} from "@application/utils/utils";
import SubscriptionModel from "@entity/license_management/requests/models/SubscriptionModel";

export default class Subscription {

    static getReduxState(){
        return useAppSelector((state: RootState) => state.subscriptionReducer);
    }

    static isFree(subscription: SubscriptionModel) {
        return subscription.type === 'free';
    }

    static getEmptySubscription(): SubscriptionModel {
        return {
            _id: '',
            type: 'empty',
            duration: '-',
            endDate: 0,
            active: false,
            startDate: 0,
            subId: '',
            totalOperationUsage: null,
            currentOperationUsage: null,
            extraOps: [],
            monthPeriod: {
                startDate: 0,
                endDate: 0,
            }
        }
    }

    static hasReachedLimit(subscription: SubscriptionModel): boolean {
        const totalWithCredits = this.getTotalOpsWithCredits(subscription);
        const currentWithCredits = this.getCurrentOpsWithCredits(subscription);
        return !subscription || (currentWithCredits >= totalWithCredits && totalWithCredits !== 0)
    }

    static isSubscriptionExpired (sub: SubscriptionModel): boolean {
        if (!sub) {
            return false;
        }
        // inactive subscription is always expired
        if (!sub.active) return true;

        // 0 means unlimited (never expires)
        if (!sub.endDate || sub.endDate === 0) return false;

        return Date.now() > sub.endDate;
    };

    static getTotalOpsWithCredits(subscription: SubscriptionModel): number {
        return (subscription?.totalOperationUsage || 0) + (subscription?.extraOps?.reduce((sum, obj) => sum + obj.totalOpsUsage, 0) || 0);
    }
    static getCurrentOpsWithCredits(subscription: SubscriptionModel): number {
        return (subscription?.currentOperationUsage || 0) + (subscription?.extraOps?.reduce((sum, obj) => sum + obj.currentOpsUsage, 0) || 0);
    }

    static getMonthlyPeriod(monthPeriod: {startDate: number, endDate: number}): string {
        const leftDate = convertTimeForSubscription(monthPeriod.startDate, {hasHours: false, hasMinutes: false, hasSeconds: false})
        const rightDate = convertTimeForSubscription(monthPeriod.endDate, {hasHours: false, hasMinutes: false, hasSeconds: false})
        return `${leftDate} - ${rightDate}`;
    }
}
