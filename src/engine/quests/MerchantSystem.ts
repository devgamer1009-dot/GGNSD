/**
 * Merchant System
 * P15 - Merchants with reputation-based pricing
 */

import { InventorySystem, Item, ItemType } from './InventorySystem.js';
import { FactionSystem, FactionType } from '../ai/FactionEventSystem.js';

export interface MerchantInventory {
  itemId: string;
  stock: number; // -1 for infinite
  basePrice: number;
}

export interface Merchant {
  id: string;
  name: string;
  factionId: FactionType;
  inventory: MerchantInventory[];
  buyMultiplier: number; // How much they pay for items (0-1)
  sellMultiplier: number; // How much they charge for items (1+)
}

export class MerchantSystem {
  private merchants: Map<string, Merchant> = new Map();
  private playerInventory: InventorySystem;
  private factionSystem: FactionSystem;

  constructor(playerInventory: InventorySystem, factionSystem: FactionSystem) {
    this.playerInventory = playerInventory;
    this.factionSystem = factionSystem;
    this.loadDefaultMerchants();
  }

  /**
   * Load default merchants
   */
  private loadDefaultMerchants(): void {
    this.addMerchant({
      id: 'blacksmith_briarhollow',
      name: 'Eadric the Smith',
      factionId: FactionType.VILLAGERS,
      inventory: [
        { itemId: 'iron_sword', stock: 3, basePrice: 80 },
        { itemId: 'iron_shield', stock: 2, basePrice: 60 },
        { itemId: 'iron_ore', stock: 10, basePrice: 15 },
      ],
      buyMultiplier: 0.5,
      sellMultiplier: 1.0,
    });

    this.addMerchant({
      id: 'merchant_goldacre',
      name: 'Merchant Guild Trader',
      factionId: FactionType.MERCHANTS,
      inventory: [
        { itemId: 'steel_sword', stock: 1, basePrice: 250 },
        { itemId: 'health_potion', stock: 5, basePrice: 30 },
        { itemId: 'stamina_potion', stock: 5, basePrice: 25 },
      ],
      buyMultiplier: 0.6,
      sellMultiplier: 1.0,
    });
  }

  /**
   * Add merchant
   */
  addMerchant(merchant: Merchant): void {
    this.merchants.set(merchant.id, merchant);
  }

  /**
   * Get merchant by ID
   */
  getMerchant(merchantId: string): Merchant | null {
    return this.merchants.get(merchantId) || null;
  }

  /**
   * Get all merchants
   */
  getAllMerchants(): Merchant[] {
    return Array.from(this.merchants.values());
  }

  /**
   * Calculate price with reputation modifier
   */
  private calculatePrice(basePrice: number, factionId: FactionType, isBuying: boolean): number {
    const reputation = this.factionSystem.getReputation(factionId);
    
    // Reputation affects price: -100 to +100 maps to 1.5x to 0.5x
    const reputationModifier = 1 - (reputation / 200); // 0.5 to 1.5
    
    if (isBuying) {
      // Player buying from merchant
      return Math.round(basePrice * reputationModifier);
    } else {
      // Player selling to merchant
      return Math.round(basePrice * reputationModifier * 0.5); // Merchants pay less
    }
  }

  /**
   * Get item price from merchant
   */
  getItemPrice(merchantId: string, itemId: string): number | null {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) return null;

    const merchantItem = merchant.inventory.find(i => i.itemId === itemId);
    if (!merchantItem) return null;

    return this.calculatePrice(merchantItem.basePrice, merchant.factionId, true);
  }

  /**
   * Buy item from merchant
   */
  buyItem(merchantId: string, itemId: string, count: number = 1): boolean {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) return false;

    const merchantItem = merchant.inventory.find(i => i.itemId === itemId);
    if (!merchantItem) return false;

    // Check stock
    if (merchantItem.stock !== -1 && merchantItem.stock < count) {
      return false;
    }

    // Calculate price
    const price = this.calculatePrice(merchantItem.basePrice, merchant.factionId, true) * count;

    // Check if player has enough gold
    if (this.playerInventory.getGold() < price) {
      return false;
    }

    // Remove gold
    this.playerInventory.removeGold(price);

    // Add item to player inventory
    const item = this.createItem(itemId);
    if (!item) return false;

    this.playerInventory.addItem(item, count);

    // Reduce stock
    if (merchantItem.stock !== -1) {
      merchantItem.stock -= count;
    }

    return true;
  }

  /**
   * Sell item to merchant
   */
  sellItem(merchantId: string, itemId: string, count: number = 1): boolean {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) return false;

    // Check if player has item
    if (!this.playerInventory.hasItem(itemId, count)) {
      return false;
    }

    // Get item
    const items = this.playerInventory.getAllItems();
    const inventoryItem = items.find(i => i.item.id === itemId);
    if (!inventoryItem) return false;

    // Calculate price
    const price = this.calculatePrice(inventoryItem.item.value, merchant.factionId, false) * count;

    // Remove item from player inventory
    this.playerInventory.removeItem(itemId, count);

    // Add gold to player
    this.playerInventory.addGold(price);

    // Add to merchant inventory (if not already there)
    const merchantItem = merchant.inventory.find(i => i.itemId === itemId);
    if (merchantItem) {
      if (merchantItem.stock !== -1) {
        merchantItem.stock += count;
      }
    } else {
      merchant.inventory.push({
        itemId,
        stock: count,
        basePrice: inventoryItem.item.value,
      });
    }

    return true;
  }

  /**
   * Create item by ID (simplified)
   */
  private createItem(itemId: string): Item | null {
    // This would normally load from item database
    const items: Record<string, Item> = {
      iron_sword: {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: ItemType.WEAPON,
        value: 50,
        stackable: false,
        maxStack: 1,
      },
      iron_shield: {
        id: 'iron_shield',
        name: 'Iron Shield',
        description: 'A reliable iron shield',
        type: ItemType.ARMOR,
        value: 40,
        stackable: false,
        maxStack: 1,
      },
      steel_sword: {
        id: 'steel_sword',
        name: 'Steel Sword',
        description: 'A superior steel sword',
        type: ItemType.WEAPON,
        value: 150,
        stackable: false,
        maxStack: 1,
      },
      iron_ore: {
        id: 'iron_ore',
        name: 'Iron Ore',
        description: 'Raw iron ore',
        type: ItemType.MATERIAL,
        value: 10,
        stackable: true,
        maxStack: 99,
      },
      health_potion: {
        id: 'health_potion',
        name: 'Health Potion',
        description: 'Restores health',
        type: ItemType.CONSUMABLE,
        value: 20,
        stackable: true,
        maxStack: 20,
      },
      stamina_potion: {
        id: 'stamina_potion',
        name: 'Stamina Potion',
        description: 'Restores stamina',
        type: ItemType.CONSUMABLE,
        value: 15,
        stackable: true,
        maxStack: 20,
      },
    };

    return items[itemId] || null;
  }
}
