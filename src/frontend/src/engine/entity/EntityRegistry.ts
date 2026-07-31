import type { EntityDefinition } from './EntityDefinition'

export class EntityRegistry {
    private entities = new Map<string, EntityDefinition>()

    register(def: EntityDefinition) {
        this.entities.set(def.name.toLowerCase(), def)
    }

    get(name: string): EntityDefinition {
        const entity = this.entities.get(name.toLowerCase())

        if (!entity) {
            throw new Error(`Entity "${name}" not registered`)
        }

        return entity
    }

    getAll() {
        return Array.from(this.entities.values());
    }

    has(name: string) {
        return this.entities.has(name.toLowerCase())
    }
}

export const entityRegistry = new EntityRegistry()
