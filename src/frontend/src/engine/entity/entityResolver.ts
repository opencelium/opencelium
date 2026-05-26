import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'
import { getValueByPath } from '@/shared/utils/getValueByPath'
import {setErrorByPath} from "@shared/utils/setErrorByPath.ts";
import {i18n} from "@shared/i18n/config/i18n.ts";
import {useRemoteValidationStore} from "@shared/form/remoteValidationStore.ts";
import {executeRemote} from "@shared/api/executeRemote.ts";
import type {Mode} from "@/engine/entity/EntityDefinition.ts";

export const entityResolver =
    (schema: any, entity: any, apiExecutor: any, initialValues: any, mode: Mode): Resolver =>
        async (values, context, options) => {

            console.log('[entityResolver] called with values=', values, 'options.names=', options?.names)

            const { setLoading } = useRemoteValidationStore.getState()
            const t = i18n.getFixedT(i18n.language, 'error');
            const baseResult = await zodResolver(schema)(
                values,
                context,
                options
            )
            console.log('[entityResolver] zodResolver result.values=', baseResult.values, 'errors=', baseResult.errors)

            const validatingFields = options.names ?? []

            const filteredErrors: any = {}

            for (const fieldName of validatingFields) {
                const error = getValueByPath(baseResult.errors, fieldName)
                if (error) {
                    setErrorByPath(filteredErrors, fieldName, error)
                }
            }

            // If there are errors on the current step → skip remote validation
            if (Object.keys(filteredErrors).length > 0) {
                return {
                    values,
                    errors: filteredErrors,
                }
            }


            const errors = { ...filteredErrors }

            // Custom field validation
            for (const fieldName of validatingFields) {
                const field = entity.fields.find(f => f.name === fieldName);
                if (!field) continue;

                const customRules = field.validation?.custom;
                if (!customRules?.length) continue;

                const value = getValueByPath(values, fieldName);

                for (const rule of customRules) {
                    const isValid = rule.validate(value, values, mode);

                    if (!isValid) {
                        setErrorByPath(errors, fieldName, {
                            type: 'custom',
                            message: rule.message,
                        });

                        break; // can stop at the first error
                    }
                }
            }

            if (entity.crossValidations?.length) {

                for (const rule of entity.crossValidations) {

                    // run the rule only if
                    // all of its fields are included in validatingFields
                    const shouldRun = rule.fields.every(f =>
                        validatingFields.includes(f)
                    )

                    if (!shouldRun) continue

                    const isValid = rule.validate(values)

                    if (!isValid) {
                        setErrorByPath(errors, rule.path, {
                            type: 'cross',
                            message: rule.message,
                        })
                    }
                }
            }


            // 2️⃣ Remote validation only for the current fields
            for (const fieldName of validatingFields) {

                const field = entity.fields.find(f => f.name === fieldName)
                if (!field) continue

                const remote = field.validation?.remote
                if (!remote) continue

                const fieldValue = getValueByPath(values, fieldName)
                if (!fieldValue) continue

                const initialValue = getValueByPath(initialValues, fieldName)

                if (remote.skipIfUnchanged && fieldValue === initialValue) {
                    continue
                }

                if (remote.shouldSkip?.()) {
                    continue
                }

                setLoading(fieldName, true)
                try {
                    const result = await executeRemote({
                        remote,
                        values,
                        fieldValue,
                        apiExecutor,
                    })

                    if (!result.success) {
                        setErrorByPath(errors, fieldName, {
                            type: 'remote',
                            message: result.message,
                        })
                    }

                } catch (e) {
                    if (remote.handleResponse) {
                        const validationResult =
                            remote.handleResponse(null, e)

                        if (validationResult !== true) {
                            setErrorByPath(errors, fieldName, {
                                type: 'remote',
                                message:
                                    typeof validationResult === 'string'
                                        ? validationResult
                                        : remote.transKey,
                            })
                        }
                    } else {
                        setErrorByPath(errors, fieldName, {
                            type: 'remote',
                            message: remote.transKey ?? t('api.unknownError', {place: 'API request'}),
                        })
                    }
                }finally {
                    setLoading(fieldName, false)
                }
            }

            return {
                values,
                errors,
            }
        }
