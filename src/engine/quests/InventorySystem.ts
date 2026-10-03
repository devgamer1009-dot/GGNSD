/**
 * Inventory System
 * P15 - Player inventory and gear management
 */

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
  QUEST = 'quest',
  MISC = 'misc',
}

export enum EquipSlot {
  WEAPON = 'weapon',
  SHIELD = 'shield',
  HEAD = 'head',
  CHEST = 'chest',
  LEGS = 'legs',
  HANDS = 'hands',
  FEET = 'feet',
  RING_1 = 'ring_1',
  RING_2 = 'ring_2',
  AMULET = 'amulet',
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  value: number; // gold value
  stackable: boolean;
  maxStack: number;
  equipSlot?: EquipSlot;
  stats?: ItemStats;
  icon?: string; // icon ID
}

export interface ItemStats {
  damage?: number;
  defense?: number;
  health?: number;
  stamina?: number;
  strength?: number;
  dexterity?: number;
  vitality?: number;
}

export interface InventoryItem {
  item: Item;
  count: number;
  equipped: boolean;
}

export class InventorySystem {
  private items: Map<string, InventoryItem> = new Map();
  private equippedItems: Map<EquipSlot, string> = new Map();
  private gold: number = 0;
  private maxWeight: number = 100; // kg
  private currentWeight: number = 0;

  /**
   * Add item to inventory
   */
  addItem(item: Item, count: number = 1): boolean {
    const existing = this.items.get(item.id);

    if (existing && item.stackable) {
      const newCount = Math.min(existing.count + count, item.maxStack);
      existing.count = newCount;
    } else {
      this.items.set(item.id, { item, count, equipped: false });
    }

    this.currentWeight += item.value * 0.01 * count; // Simplified weight
    return true;
  }

  /**
   * Remove item from inventory
   */
  removeItem(itemId: string, count: number = 1): boolean {
    const existing = this.items.get(itemId);
    if (!existing) return false;

    if (existing.count <= count) {
      this.items.delete(itemId);
      this.equippedItems.forEach((id, slot) => {
        if (id === itemId) this.equippedItems.delete(slot);
      });
    } else {
      existing.count -= count;
    }

    this.currentWeight -= existing.item.value * 0.01 * count;
    return true;
  }

  /**
   * Check if player has item
   */
  hasItem(itemId: string, count: number = 1): boolean {
    const existing = this.items.get(itemId);
    return existing ? existing.count >= count : false;
  }

  /**
   * Get item count
   */
  getItemCount(itemId: string): number {
    const existing = this.items.get(itemId);
    return existing ? existing.count : 0;
  }

  /**
   * Equip item
   */
  equip(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item || !item.item.equipSlot) return false;

    // Unequip current item in slot
    const currentEquipped = this.equippedItems.get(item.item.equipSlot);
    if (currentEquipped) {
      const current = this.items.get(currentEquipped);
      if (current) current.equipped = false;
    }

    // Equip new item
    item.equipped = true;
    this.equippedItems.set(item.item.equipSlot, itemId);
    return true;
  }

  /**
   * Unequip item
   */
  unequip(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    item.equipped = false;
    this.equippedItems.forEach((id, slot) => {
      if (id === itemId) this.equippedItems.delete(slot);
    });
    return true;
  }

  /**
   * Get equipped item in slot
   */
  getEquippedItem(slot: EquipSlot): Item | null {
    const itemId = this.equippedItems.get(slot);
    if (!itemId) return null;
    const item = this.items.get(itemId);
    return item ? item.item : null;
  }

  /**
   * Get all equipped items
   */
  getAllEquipped(): Map<EquipSlot, Item> {
    const equipped = new Map<EquipSlot, Item>();
    this.equippedItems.forEach((itemId, slot) => {
      const item = this.items.get(itemId);
      if (item) equipped.set(slot, item.item);
    });
    return equipped;
  }

  /**
   * Add gold
   */
  addGold(amount: number): void {
    this.gold += amount;
  }

  /**
   * Remove gold
   */
  removeGold(amount: number): boolean {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  /**
   * Get gold amount
   */
  getGold(): number {
    return this.gold;
  }

  /**
   * Get all items
   */
  getAllItems(): InventoryItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get items by type
   */
  getItemsByType(type: ItemType): InventoryItem[] {
    return Array.from(this.items.values()).filter(i => i.item.type === type);
  }

  /**
   * Get inventory weight
   */
  getWeight(): { current: number; max: number } {
    return { current: this.currentWeight, max: this.maxWeight };
  }

  /**
   * Clear inventory
   */
  clear(): void {
    this.items.clear();
    this.equippedItems.clear();
    this.gold = 0;
    this.currentWeight = 0;
  }
}
