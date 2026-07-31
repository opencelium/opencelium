import { userDefinition } from '@entities/user/user.definition.tsx'
import { connectorDefinition } from '@entities/connector/connector.definition.tsx'
import { scheduleDefinition } from '@entities/schedule/schedule.definition.tsx'
import { roleDefinition } from '@entities/role/role.definition.tsx'
import { ldapDefinition } from '@entities/ldap/ldap.definition.tsx'
import { uiDefinition } from '@entities/ui/ui.definition.tsx'
import { metaEntityDefinition } from '@entities/meta/meta.definition.ts'
import { categoryDefinition } from '@entities/category/category.definition.tsx'
import { notificationTemplateDefinition } from '@entities/notificationTemplate/notificationTemplate.definition.tsx'
import { dataAggregatorDefinition } from '@entities/dataAggregator/dataAggregator.definition.tsx'
import { invokerDefinition } from '@entities/invoker/invoker.definition.tsx'
import { connectionTemplateDefinition } from '@entities/connectionTemplate/connectionTemplate.definition.tsx'
import { updateAssistantDefinition } from '@entities/updateAssistant/updateAssistant.definition.tsx'
import { systemCheckDefinition } from '@entities/systemCheck/systemCheck.definition.tsx'
import { supportFileDefinition } from '@entities/supportFile/supportFile.definition.tsx'
import { connectionDefinition } from '@entities/connection/connection.definition.tsx'
import { subscriptionDefinition } from '@entities/subscription/subscription.definition.tsx'
import { systemConfigDefinition } from '@entities/systemConfig/systemConfig.definition.tsx'
import {entityRegistry} from "@/engine/entity/EntityRegistry.ts";
import {setupGlobalOverrides} from "@/engine/entity/overrides/setupOverrides.tsx";
import {setupLocalOverrides} from "@/engine/entity/overrides/setupLocalOverrides.tsx";

export function registerEntities() {

    setupGlobalOverrides();
    setupLocalOverrides();
    entityRegistry.register(metaEntityDefinition);

    entityRegistry.register(userDefinition);
    entityRegistry.register(roleDefinition);
    entityRegistry.register(ldapDefinition);
    entityRegistry.register(invokerDefinition);
    entityRegistry.register(connectorDefinition);
    entityRegistry.register(scheduleDefinition);
    entityRegistry.register(uiDefinition);
    entityRegistry.register(categoryDefinition);
    entityRegistry.register(notificationTemplateDefinition);
    entityRegistry.register(dataAggregatorDefinition);
    entityRegistry.register(connectionTemplateDefinition);
    entityRegistry.register(updateAssistantDefinition);
    entityRegistry.register(systemCheckDefinition);
    entityRegistry.register(supportFileDefinition);
    entityRegistry.register(connectionDefinition);
    entityRegistry.register(subscriptionDefinition);
    entityRegistry.register(systemConfigDefinition);
}
