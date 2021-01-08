import {checkCronExpression} from "@utils/app";

describe.only('Regular Expression for Cron Expression ', () => {
    const truthyCronExpressions = [
        //test seconds
        '0/1 0 0 0 0 ?', '1-5 0 0 0 0 ?', '2,3 0 0 0 0 ?', '* 0 0 0 0 ?',
        //test minutes
        '* 1 0 0 0 ?', '* 59 0 0 0 ?', '* * 0 0 0 ?', '* 0/0 0 0 0 ?', '* 59/59 0 0 0 ?', '* /59 0 0 0 ?', '* */59 0 0 0 ?',
        //test hours
        '* 1 1 0 0 ?', '* 59 23,20 0 0 ?', '* * 1-3,20 0 0 ?', '* 0/0 0/0 0 0 ?', '* 59/59 23/23 0 0 ?', '* /59 /23 0 0 ?', '* */59 */23 0 0 ?',
        //test days
        '* 1 1 21 0 ?', '* 59 23 L 0 ?', '* * * W 0 ?', '* 0/0 0/0 0/0 0 ?', '* 59/59 23/23 31/31 0 ?', '* /59 /23 /31 0 ?', '* */59 */23 */31 0 ?',
        //test months
        '* 1 1 21 0 ?', '* 59 23 31 11 ?', '* * * * * ?', '* 0/0 0/0 0/0 0/0 ?', '* 59/59 23/23 31/31 11/11 ?', '* /59 /23 /31 /11 ?', '* */59 */23 */31 */11 ?',
        //test day of week
        '* 1 1 21 0 1', '* 59 23 31 11 ?', '* * * * * L', '* 0/0 0/0 0/0 0/0 #', '* 59/59 23/23 31/31 11/11 1-2,3-4,5', '* /59 /23 /31 /11 ?', '* */59 */23 */31 */11 ?',
        //test year
        '* 1 1 21 0 1 1970', '* 59 23 31 11 ? 1989-2039', '* * * * * L 2021,2022', '* 0/0 0/0 0/0 0/0 2010/2020', '* 59/59 23/23 31/31 11/11 1-2,3-4,5 *', '* /59 /23 /31 /11 ?', '* */59 */23 */31 */11 ?',
    ];
    const falsyCronExpressions = [
        //test seconds
        'a5 0 0 0 0 ?',
    ];

    for(let i = 0; i < truthyCronExpressions.length; i++){
        test(truthyCronExpressions[i], () => {
            const received = checkCronExpression(truthyCronExpressions[i]);
            expect(received).toBeTruthy();
        });
    }

    for(let i = 0; i < falsyCronExpressions.length; i++){
        test(falsyCronExpressions[i], () => {
            const received = checkCronExpression(falsyCronExpressions[i]);
            expect(received).toBeFalsy();
        });
    }
});