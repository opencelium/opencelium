/**
 * Class for Fields in CheckConnection
 */
export default class CFields{

    /**
     * to get counter value using the currentIndex
     */
    static getLoopLength(currentIndex, loopLengths){
        let divider = currentIndex;
        let result = '';
        for(let i = 0; i < loopLengths.length - 1; i++){
            result += '1|';
        }
        result += '1';
        result = result.split('|');
        for(let i = 0; i < loopLengths.length - 1; i++){
            const division = CFields.getMultiplication(loopLengths, i);
            let nextValue = Math.floor(divider / division);
            if(nextValue === loopLengths[i]){
                nextValue = Math.floor((divider - 1) / division);
            }
            divider = divider - nextValue * division;
            result[i] = nextValue + 1;
            if(i === loopLengths.length - 2){
                result[i + 1] = divider + 1 > loopLengths[i + 1] ? divider : divider + 1;
            }
        }
        return result.join('|');
    }

    /**
     * to multiply all elements in array starting from specific index
     */
    static getMultiplication(length, startIndex = 0){
        return length.reduce((elemA, elemB, key) => {
            if(key <= startIndex)
                return 1;
            return parseInt(elemA) * parseInt(elemB)
        }, 1);
    }
}