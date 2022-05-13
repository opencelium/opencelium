import en from './en';
import {interpolations as EntitiesInterpolations} from '@entity/index';
import {translations as EntitiesTranslations} from '@entity/index';
import {deepObjectsMerge} from "../utils/utils";

const interpolations = {
    ...EntitiesInterpolations,
}

const translations = deepObjectsMerge({en}, {...EntitiesTranslations});
export {
    interpolations,
    translations,
}

export default {
    en,
}