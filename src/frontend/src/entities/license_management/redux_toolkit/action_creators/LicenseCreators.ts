import {createAsyncThunk} from "@reduxjs/toolkit";
import {errorHandler} from "@application/utils/utils";
import LicenseRequest from "@entity/license_management/requests/classes/LicenseRequest";
import {
    ActivateLicenseFileRequest,
    ActivateLicenseStringRequest
} from "@entity/license_management/requests/interfaces/ILicenseRequest";

export const generateActivateRequest = createAsyncThunk(
    'license/generate/request',
    async(data: never, thunkAPI) => {
        try {
            const request = new LicenseRequest();
            const response = await request.generateActivateRequest();
            return response.data;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const activateLicenseFile = createAsyncThunk(
    'license/activate/file',
    async(data: ActivateLicenseFileRequest, thunkAPI) => {
        try {
            const request = new LicenseRequest();
            const response = await request.activateFile(data);
            return response.data.license;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const activateLicenseString = createAsyncThunk(
    'license/activate/string',
    async(data: ActivateLicenseStringRequest, thunkAPI) => {
        try {
            const request = new LicenseRequest();
            const response = await request.activateString(data);
            return response.data.license;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getLicenseStatus = createAsyncThunk(
    'license/get/status',
    async(data: never, thunkAPI) => {
        try {
            const request = new LicenseRequest();
            const response = await request.getStatus();
            return response.data.status;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getActivationRequestStatus = createAsyncThunk(
    'license/get/activation-request/status',
    async(data: never, thunkAPI) => {
        try {
            const request = new LicenseRequest();
            const response = await request.getActivationRequestStatus();
            return response.data.status;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const deleteLicense = createAsyncThunk(
    'license/license',
    async(licenseId: string, thunkAPI) => {
        try {
            const request = new LicenseRequest({endpoint: `/${licenseId}`});
            await request.deleteLicense();
            return licenseId;
        } catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    generateActivateRequest,
    activateLicenseFile,
    activateLicenseString,
    getLicenseStatus,
    getActivationRequestStatus,
}
