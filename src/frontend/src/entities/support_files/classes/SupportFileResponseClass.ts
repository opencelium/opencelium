import {SupportFileResponse} from "@root/requests/interfaces/ISupportFile";
import {SupportFileObject, SupportFileType} from "@entity/support_files/interfaces/ISupportFileResponse";
import {getDateFormat} from "@application/utils/utils";

export default class SupportFileResponseClass {

    supportFiles: string[] = [];

    type: SupportFileType;

    supportFilesObjects: SupportFileObject[] = [];

    constructor(data: SupportFileResponse, type: SupportFileType) {
        this.supportFiles = data.supportFiles;
        this.type = type;
        this.supportFilesObjects = this.convertFilenamesIntoObjects()
    }

    getSplitter(): string {
        switch(this.type) {
            case 'error':
                return '_e_support_';
            case 'success':
                return '_s_support_';
        }
    }

    convertFilenamesIntoObjects(): SupportFileObject[] {
        const objets = [];
        for(let i = 0; i < this.supportFiles.length; i++) {
            objets.push(this.convertFilenameIntoObject(this.supportFiles[i]));
        }
        return objets;
    }

    convertFilenameIntoObject(filename: string): SupportFileObject {
        try {
            const filenameSplit = filename.split(this.getSplitter());
            if (filenameSplit.length !== 2) {
                throw {message: 'WRONG_SUPPORT_FILENAME'};
            }
            const timestamp = getDateFormat(+filenameSplit[1].substring(0, filenameSplit[1].length - '.zip'.length));
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
