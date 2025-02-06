import { createAsyncThunk } from "@reduxjs/toolkit";
import { RemoteApiRequestProps } from "@application/requests/interfaces/IApplication";
import { ApplicationRequest } from "@application/requests/classes/Application";
import { errorHandler } from "@application/utils/utils";
import {RuleRequest} from "@root/requests/classes/Rule";
import {RuleBaseModel, RuleRecordModel} from "@root/requests/models/Rule";

export const createRule = createAsyncThunk(
    'connection/create/rule',
    async(data: {rule: RuleBaseModel, connectionId: number}, thunkAPI) => {
        try{
            const request = new RuleRequest({endpoint: `/${data.connectionId}/rule`});
            const response = await request.createRule(data.rule);
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const updateRule = createAsyncThunk(
    'connection/update/rule',
    async(data: {rule: RuleRecordModel, connectionId: number}, thunkAPI) => {
        try{
            const request = new RuleRequest({endpoint: `/${data.connectionId}/rule/${data.rule.ruleId}`});
            await request.updateRule(data.rule);
            return data.rule;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getRule = createAsyncThunk(
    'connection/get/rule',
    async(data: {ruleId: string, connectionId: number}, thunkAPI) => {
        try{
            const request = new RuleRequest({endpoint: `/${data.connectionId}/rule/${data.ruleId}`});
            const response = await request.getRule();
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const getAllRulesByConnection = createAsyncThunk(
    'connection/get/rules',
    async(data: {connectionId: number}, thunkAPI) => {
        try{
            const request = new RuleRequest({endpoint: `/${data.connectionId}/rule/all`});
            const response = await request.getRulesByConnection();
            return response.data;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const deleteRule = createAsyncThunk(
    'connection/delete/rule',
    async(data: {ruleId: string, connectionId: number}, thunkAPI) => {
        try{
            const request = new RuleRequest({endpoint: `/${data.connectionId}/rule/${data.ruleId}`});
            await request.deleteRule();
            return data.ruleId;
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)
export const deleteAllRulesByConnection = createAsyncThunk(
    'connection/delete/rules',
    async(data: {connectionId: number}, thunkAPI) => {
        try{
            const request = new RuleRequest({endpoint: `/${data.connectionId}/rule/all`});
            await request.deleteRulesByConnection();
        }catch(e){
            return thunkAPI.rejectWithValue(errorHandler(e));
        }
    }
)

export default {
    createRule,
    updateRule,
    getRule,
    getAllRulesByConnection,
    deleteRule,
    deleteAllRulesByConnection,
}
