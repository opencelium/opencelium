import {SupportFileResponse} from "@root/requests/interfaces/ISupportFile";
import {SupportFileObject, SupportFileType} from "@entity/support_files/interfaces/ISupportFileResponse";
import {getDateFormat} from "@application/utils/utils";

export default class SupportFileResponseClass {

    supportFile: string = '';

    type: SupportFileType;

    supportFileObject: SupportFileObject;

    constructor(data: SupportFileResponse, type: SupportFileType) {
        this.supportFile = data.supportFile;
        this.type = type;
        this.supportFileObject = this.convertFilenameIntoObject(this.supportFile)
    }

    getSplitter(): string {
        switch(this.type) {
            case 'error':
                return '_e_support_';
            case 'success':
                return '_s_support_';
        }
    }
    convertFilenameIntoObject(filename: string): SupportFileObject | undefined {
        try {
            const filenameSplit = filename.split(this.getSplitter());
            if (filenameSplit.length !== 2) {
                return undefined;
            }
            const timestamp = getDateFormat(+`${filenameSplit[1].substring(0, filenameSplit[1].length - '.zip'.length)}000`);
            return {
                path: filename,
                connectionId: filenameSplit[0],
                timestamp,
            }
        } catch (e) {
            throw e;
        }

    }
}
