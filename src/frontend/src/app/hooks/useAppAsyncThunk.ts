import {useState} from "react";
import {useAppDispatch} from "@shared/lib/storeHooks.ts";
import type {AsyncThunk} from "@reduxjs/toolkit";

export function useAppAsyncThunk<
    Returned,
    ThunkArg
>(
    thunk: AsyncThunk<Returned, ThunkArg, unknown>
) {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);

    const execute = async (arg: ThunkArg): Promise<Returned> => {
        setLoading(true);
        try {
            return await dispatch(thunk(arg)).unwrap();
        } finally {
            setLoading(false);
        }
    };

    return { execute, loading };
}
