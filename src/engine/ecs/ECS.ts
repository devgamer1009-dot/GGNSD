/**
 * Minimal ECS — custom implementation
 * Engine layer — never imports game
 * 
 * ADR-007: Custom minimal ECS instead of bitECS
 * - Context: bitECS 0.4 API complex with TS strict mode
 * - Decision: Simple custom ECS with SoA-like component storage
 * - Consequences: Less features but full control, easier to debug
 */

export type Entity = number;

export interface Component {
  __entity?: Entity;
  [key: string]: any;
}

export class World {
  private nextEntityId = 0;
  private entities = new Set<Entity>();
  private components = new Map<Entity, Map<string, Component>>();

  createEntity(): Entity {
    const id = this.nextEntityId++;
    this.entities.add(id);
    this.components.set(id, new Map());
    return id;
  }

  destroyEntity(entity: Entity): void {
    this.entities.delete(entity);
    this.components.delete(entity);
  }

  entityExists(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  addComponent<T extends Component>(entity: Entity, component: T): void {
    const entityComponents = this.components.get(entity);
    if (entityComponents) {
      component.__entity = entity;
      entityComponents.set(component.constructor.name, component);
    }
  }

  removeComponent<T extends Component>(entity: Entity, componentClass: new (...args: any[]) => T): void {
    const entityComponents = this.components.get(entity);
    if (entityComponents) {
      entityComponents.delete(componentClass.name);
    }
  }

  getComponent<T extends Component>(entity: Entity, componentClass: new (...args: any[]) => T): T | undefined {
    const entityComponents = this.components.get(entity);
    if (entityComponents) {
      return entityComponents.get(componentClass.name) as T | undefined;
    }
    return undefined;
  }

  hasComponent<T extends Component>(entity: Entity, componentClass: new (...args: any[]) => T): boolean {
    const entityComponents = this.components.get(entity);
    if (entityComponents) {
      return entityComponents.has(componentClass.name);
    }
    return false;
  }

  query<T extends Component>(componentClass: new (...args: any[]) => T): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities) {
      if (this.hasComponent(entity, componentClass)) {
        result.push(entity);
      }
    }
    return result;
  }

  queryMultiple<T extends Component[]>(...componentClasses: { new (...args: any[]): any }[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities) {
      let hasAll = true;
      for (const compClass of componentClasses) {
        if (!this.hasComponent(entity, compClass)) {
          hasAll = false;
          break;
        }
      }
      if (hasAll) {
        result.push(entity);
      }
    }
    return result;
  }

  getEntityCount(): number {
    return this.entities.size;
  }
}

export function createWorld(): World {
  return new World();
}
