
/**
 * observations that define what class properties should be observable
 */
export interface IObservation{
    value: any,
    functionName: string,
}

export interface DispatchParamsProps<T>{
    hasNoValidation?: boolean,
    mapping?: (entity: T) => any,
}
enum TRIPLET_STATE{
    INITIAL= 'INITIAL',
    TRUE= 'TRUE',
    FALSE= 'FALSE',
}


export const VERSION_STATUS = {
    OLD: 'old',
    CURRENT: 'current',
    AVAILABLE: 'available',
    NOT_AVAILABLE: 'not_available'
}
enum API_REQUEST_STATE{
    INITIAL= 'INITIAL',
    START=  'START',
    FINISH= 'FINISH',
    ERROR=  'ERROR',
    PAUSE=  'PAUSE',
}

const OC_NAME = 'OpenCelium';

const OC_DESCRIPTION = 'OpenCelium is super duper hub';

export {
    API_REQUEST_STATE,
    TRIPLET_STATE,
    OC_NAME,
    OC_DESCRIPTION,
}