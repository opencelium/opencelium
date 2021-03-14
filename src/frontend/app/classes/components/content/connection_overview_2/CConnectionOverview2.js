import {PROCESS_HEIGHT} from "@components/content/connection_overview_2/elements/Process";
import {ARROW_END_LENGTH, ARROW_WIDTH} from "@components/content/connection_overview_2/elements/Arrow";

export default class CConnectionOverview2{
    static calculateFromItemX(from){
        return from.x + from.width;
    }

    static calculateFromItemY(from){
        let processOffsetY = (PROCESS_HEIGHT / 2) - (ARROW_WIDTH / 2);
        return from.y + processOffsetY;
    }

    static calculateToItemX(to){
        return to.x - ARROW_END_LENGTH;
    }

    static calculateToItemY(to){
        let processOffsetY = (PROCESS_HEIGHT / 2) - (ARROW_WIDTH / 2);
        return to.y + processOffsetY;
    }

}