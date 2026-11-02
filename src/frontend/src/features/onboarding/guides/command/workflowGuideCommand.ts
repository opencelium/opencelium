import type { CommandNode } from '@shared/command/types'
import type { IconName } from '@shared/ui/primitives/Icon/Icon.types'
import { startWorkflowGuide } from '../model/startWorkflowGuide'
import { WORKFLOW_GUIDES, type WorkflowGuideId } from '../model/workflowGuides'

type GuideArgs = Record<string, unknown>

type GuideCommand = { value: string; aliases?: string[]; guideId: WorkflowGuideId; icon: IconName }

const GUIDE_COMMANDS: GuideCommand[] = [
    { value: 'url', aliases: ['endpoint'], guideId: 'method-url', icon: 'link' },
    { value: 'headers', aliases: ['header'], guideId: 'method-headers', icon: 'list' },
    { value: 'body', guideId: 'method-body', icon: 'code' },
    { value: 'try', aliases: ['test'], guideId: 'method-try', icon: 'send' },
    { value: 'transformation', aliases: ['script', 'transform'], guideId: 'method-transformation', icon: 'sparkles' },
]

const run = (guideId: WorkflowGuideId) => (args: GuideArgs): void => {
    startWorkflowGuide(guideId, typeof args.method === 'string' ? args.method : undefined)
}

/**
 * `workflow show <what> [method]`. The method is optional and deliberately has no
 * suggestion resolver: the palette only runs a command whose next placeholder has none,
 * and "show the headers" on the selected method has to work without naming one.
 */
export const workflowGuideCommand: CommandNode<GuideArgs> = {
    type: 'literal',
    value: 'show',
    aliases: ['where'],
    icon: 'eye',
    description: 'commandPalette.descriptions.workflowShow',
    children: GUIDE_COMMANDS.map(command => ({
        type: 'literal',
        value: command.value,
        aliases: command.aliases,
        icon: command.icon,
        description: WORKFLOW_GUIDES[command.guideId].descriptionKey,
        execute: run(command.guideId),
        children: [{ type: 'entity', name: 'method', execute: run(command.guideId) }],
    })),
}
