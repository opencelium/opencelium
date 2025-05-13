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
    convertFilenameIntoObject(filename: string): SupportFileObject | undefined {
        try {
            const regex = /\/(\d+)\/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}_\d+)_([sf])_(\d+)\.zip$/;
            const match = filename.match(regex);
            if (!match) {
                throw new Error("Path does not match expected format");
            }
            const [, connectionIdStr, datetimeStr, status, executionIdStr] = match;
            if (status !== this.type) {
                return undefined;
            }
            const [datePart, timePart] = datetimeStr.split('_');
            const datetime = new Date(`${datePart}T${timePart.replace('-', ':')}:00`);
            const timestamp = getDateFormat(datetime);
                return {
                    path: filename,
                    connectionId: connectionIdStr,
                    timestamp,
                }
        } catch (e) {
            throw e;
        }

    }
}
