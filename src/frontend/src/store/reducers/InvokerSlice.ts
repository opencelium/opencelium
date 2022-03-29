import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {IInvoker} from "@interface/invoker/IInvoker";
import {
    addInvoker,
    checkInvokerName,
    deleteInvokerByName,
    deleteInvokerImage,
    deleteInvokersById,
    getAllInvokers,
    getInvokerByName, importInvoker,
    updateInvoker, updateOperation,
    uploadInvokerImage
} from "@action/InvokerCreators";
import {IResponse, ResponseMessages} from "@requestInterface/application/IResponse";
import {CommonState} from "../store";
import {ICommonState} from "@interface/application/core";
import {IOperation} from "@interface/invoker/IOperation";
import {ITemplate} from "@interface/connection/ITemplate";
import {API_REQUEST_STATE, TRIPLET_STATE} from "@interface/application/IApplication";

export interface InvokerState extends ICommonState{
    invokers: IInvoker[],
    importingInvoker: API_REQUEST_STATE,
    isCurrentInvokerHasUniqueTitle: TRIPLET_STATE,
    checkingInvokerTitle: API_REQUEST_STATE,
    updatingOperation: API_REQUEST_STATE,
    addingInvoker: API_REQUEST_STATE,
    updatingInvoker: API_REQUEST_STATE,
    gettingInvoker: API_REQUEST_STATE,
    gettingInvokers: API_REQUEST_STATE,
    deletingInvokerById: API_REQUEST_STATE,
    deletingInvokersById: API_REQUEST_STATE,
    uploadingInvokerImage: API_REQUEST_STATE,
    deletingInvokerImage: API_REQUEST_STATE,
    currentInvoker: IInvoker,
    operation: IOperation,
}

const initialState: InvokerState = {
    invokers: [],
    importingInvoker: API_REQUEST_STATE.INITIAL,
    isCurrentInvokerHasUniqueTitle: TRIPLET_STATE.INITIAL,
    checkingInvokerTitle: API_REQUEST_STATE.INITIAL,
    updatingOperation: API_REQUEST_STATE.INITIAL,
    addingInvoker: API_REQUEST_STATE.INITIAL,
    updatingInvoker: API_REQUEST_STATE.INITIAL,
    gettingInvoker: API_REQUEST_STATE.INITIAL,
    gettingInvokers: API_REQUEST_STATE.INITIAL,
    deletingInvokerById: API_REQUEST_STATE.INITIAL,
    deletingInvokersById: API_REQUEST_STATE.INITIAL,
    uploadingInvokerImage: API_REQUEST_STATE.INITIAL,
    deletingInvokerImage: API_REQUEST_STATE.INITIAL,
    currentInvoker: null,
    operation: null,
    ...CommonState,
}

export const invokerSlice = createSlice({
    name: 'invoker',
    initialState,
    reducers: {
        cleanMethod: (state) => {
            state.operation = null;
        }
    },
    extraReducers: {
        [importInvoker.pending.type]: (state, action: PayloadAction<ITemplate>) => {
            state.importingInvoker = API_REQUEST_STATE.START;
        },
        [importInvoker.fulfilled.type]: (state, action: PayloadAction<IInvoker>) => {
            state.importingInvoker = API_REQUEST_STATE.FINISH;
            let index = state.invokers.findIndex(i => i.name === action.payload.name)
            if(index === -1){
                state.invokers.push(action.payload);
            } else{
                state.invokers = state.invokers.map(invoker => invoker.name === action.payload.name ? action.payload : invoker);
            }
            state.error = null;
        },
        [importInvoker.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.importingInvoker = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [updateOperation.pending.type]: (state, action: PayloadAction<IInvoker>) => {
            state.updatingOperation = API_REQUEST_STATE.START;
        },
        [updateOperation.fulfilled.type]: (state, action: PayloadAction<IOperation>) => {
            state.updatingOperation = API_REQUEST_STATE.FINISH;
            state.operation = action.payload
        },
        [updateOperation.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingOperation = API_REQUEST_STATE.ERROR;
        },
        [checkInvokerName.pending.type]: (state) => {
            state.checkingInvokerTitle = API_REQUEST_STATE.START;
        },
        [checkInvokerName.fulfilled.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingInvokerTitle = API_REQUEST_STATE.FINISH;
            state.isCurrentInvokerHasUniqueTitle = action.payload.message === ResponseMessages.NOT_EXISTS ? TRIPLET_STATE.TRUE : TRIPLET_STATE.FALSE;
            state.error = null;
        },
        [checkInvokerName.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.checkingInvokerTitle = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [addInvoker.pending.type]: (state, action: PayloadAction<IInvoker>) => {
            state.addingInvoker = API_REQUEST_STATE.START;
        },
        [addInvoker.fulfilled.type]: (state, action: PayloadAction<IInvoker>) => {
            state.addingInvoker = API_REQUEST_STATE.FINISH;
            state.invokers.push(action.payload);
            state.error = null;
        },
        [addInvoker.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.addingInvoker = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.EXISTS){
                state.isCurrentInvokerHasUniqueTitle = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [updateInvoker.pending.type]: (state) => {
            state.updatingInvoker = API_REQUEST_STATE.START;
        },
        [updateInvoker.fulfilled.type]: (state, action: PayloadAction<IInvoker>) => {
            state.updatingInvoker = API_REQUEST_STATE.FINISH;
            state.invokers = state.invokers.map(invoker => invoker.invokerId === action.payload.invokerId ? action.payload : invoker);
            if(state.currentInvoker && state.currentInvoker.invokerId === action.payload.invokerId){
                state.currentInvoker = action.payload;
            }
            state.error = null;
        },
        [updateInvoker.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.updatingInvoker = API_REQUEST_STATE.ERROR;
            if(action.payload?.message === ResponseMessages.EXISTS){
                state.isCurrentInvokerHasUniqueTitle = TRIPLET_STATE.FALSE;
            }
            state.error = action.payload;
        },
        [getInvokerByName.pending.type]: (state) => {
            state.gettingInvoker = API_REQUEST_STATE.START;
        },
        [getInvokerByName.fulfilled.type]: (state, action: PayloadAction<IInvoker>) => {
            state.gettingInvoker = API_REQUEST_STATE.FINISH;
            state.currentInvoker = action.payload;
            state.error = null;
        },
        [getInvokerByName.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingInvoker = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [getAllInvokers.pending.type]: (state) => {
            state.gettingInvokers = API_REQUEST_STATE.START;
        },
        [getAllInvokers.fulfilled.type]: (state, action: PayloadAction<IInvoker[]>) => {
            state.gettingInvokers = API_REQUEST_STATE.FINISH;
            state.invokers = action.payload;
            state.error = null;
        },
        [getAllInvokers.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.gettingInvokers = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteInvokerByName.pending.type]: (state) => {
            state.deletingInvokerById = API_REQUEST_STATE.START;
        },
        [deleteInvokerByName.fulfilled.type]: (state, action: PayloadAction<IInvoker>) => {
            state.deletingInvokerById = API_REQUEST_STATE.FINISH;
            state.invokers = state.invokers.filter(invoker => invoker.name !== action.payload.name);
            if(state.currentInvoker && state.currentInvoker.name === action.payload.name){
                state.currentInvoker = null;
            }
            state.error = null;
        },
        [deleteInvokerByName.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingInvokerById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteInvokersById.pending.type]: (state) => {
            state.deletingInvokersById = API_REQUEST_STATE.START;
        },
        [deleteInvokersById.fulfilled.type]: (state, action: PayloadAction<number[]>) => {
            state.deletingInvokersById = API_REQUEST_STATE.FINISH;
            state.invokers = state.invokers.filter(invoker => action.payload.findIndex(id => id === invoker.invokerId) === -1);
            if(state.currentInvoker && action.payload.findIndex(id => id === state.currentInvoker.invokerId) !== -1){
                state.currentInvoker = null;
            }
            state.error = null;
        },
        [deleteInvokersById.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingInvokersById = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [uploadInvokerImage.pending.type]: (state) => {
            state.uploadingInvokerImage = API_REQUEST_STATE.START;
        },
        [uploadInvokerImage.fulfilled.type]: (state, action: PayloadAction<IInvoker>) => {
            state.uploadingInvokerImage = API_REQUEST_STATE.FINISH;
            state.invokers = state.invokers.map(invoker => invoker.invokerId === action.payload.invokerId ? action.payload : invoker);
            if(state.currentInvoker && state.currentInvoker.invokerId === action.payload.id){
                state.currentInvoker = action.payload;
            }
            state.error = null;
        },
        [uploadInvokerImage.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.uploadingInvokerImage = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
        [deleteInvokerImage.pending.type]: (state) => {
            state.deletingInvokerImage = API_REQUEST_STATE.START;
        },
        [deleteInvokerImage.fulfilled.type]: (state, action: PayloadAction<IInvoker>) => {
            state.deletingInvokerImage = API_REQUEST_STATE.FINISH;
            state.invokers = state.invokers.map(invoker => invoker.invokerId === action.payload.invokerId ? action.payload : invoker);
            if(state.currentInvoker && state.currentInvoker.invokerId === action.payload.id){
                state.currentInvoker = action.payload;
            }
            state.error = null;
        },
        [deleteInvokerImage.rejected.type]: (state, action: PayloadAction<IResponse>) => {
            state.deletingInvokerImage = API_REQUEST_STATE.ERROR;
            state.error = action.payload;
        },
    }
})

export const { cleanMethod } = invokerSlice.actions;

export default invokerSlice.reducer;