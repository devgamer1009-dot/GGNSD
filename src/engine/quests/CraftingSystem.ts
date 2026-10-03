/**
 * Crafting System
 * P15 - Forge and cooking crafting
 */

import { InventorySystem } from './InventorySystem.js';
import { Item, ItemType } from './InventorySystem.js';

export enum CraftingStation {
  FORGE = 'forge',
  COOKING = 'cooking',
  ALCHEMY = 'alchemy',
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  station: CraftingStation;
  result: {
    itemId: string;
    count: number;
  };
  ingredients: Array<{
    itemId: string;
    count: number;
  }>;
  requiredLevel?: number;
  craftTime: number; // seconds
}

export class CraftingSystem {
  private recipes: Map<string, CraftingRecipe> = new Map();
  private inventory: InventorySystem;

  constructor(inventory: InventorySystem) {
    this.inventory = inventory;
    this.loadDefaultRecipes();
  }

  /**
   * Load default crafting recipes
   */
  private loadDefaultRecipes(): void {
    // Forge recipes
    this.addRecipe({
      id: 'iron_sword',
      name: 'Iron Sword',
      description: 'A sturdy iron sword',
      station: CraftingStation.FORGE,
      result: { itemId: 'iron_sword', count: 1 },
      ingredients: [
        { itemId: 'iron_ore', count: 3 },
        { itemId: 'wood', count: 1 },
      ],
      craftTime: 10,
    });

    this.addRecipe({
      id: 'iron_shield',
      name: 'Iron Shield',
      description: 'A reliable iron shield',
      station: CraftingStation.FORGE,
      result: { itemId: 'iron_shield', count: 1 },
      ingredients: [
        { itemId: 'iron_ore', count: 4 },
        { itemId: 'wood', count: 2 },
      ],
      craftTime: 15,
    });

    this.addRecipe({
      id: 'steel_sword',
      name: 'Steel Sword',
      description: 'A superior steel sword',
      station: CraftingStation.FORGE,
      result: { itemId: 'steel_sword', count: 1 },
      ingredients: [
        { itemId: 'steel_ingot', count: 3 },
        { itemId: 'wood', count: 1 },
      ],
      requiredLevel: 5,
      craftTime: 20,
    });

    // Cooking recipes
    this.addRecipe({
      id: 'cooked_meat',
      name: 'Cooked Meat',
      description: 'Restores health',
      station: CraftingStation.COOKING,
      result: { itemId: 'cooked_meat', count: 1 },
      ingredients: [
        { itemId: 'raw_meat', count: 1 },
      ],
      craftTime: 5,
    });

    this.addRecipe({
      id: 'hearty_stew',
      name: 'Hearty Stew',
      description: 'Restores health and stamina',
      station: CraftingStation.COOKING,
      result: { itemId: 'hearty_stew', count: 1 },
      ingredients: [
        { itemId: 'raw_meat', count: 2 },
        { itemId: 'vegetables', count: 3 },
        { itemId: 'water', count: 1 },
      ],
      craftTime: 10,
    });

    this.addRecipe({
      id: 'bread',
      name: 'Bread',
      description: 'Simple bread',
      station: CraftingStation.COOKING,
      result: { itemId: 'bread', count: 2 },
      ingredients: [
        { itemId: 'flour', count: 2 },
        { itemId: 'water', count: 1 },
      ],
      craftTime: 8,
    });
  }

  /**
   * Add a recipe
   */
  addRecipe(recipe: CraftingRecipe): void {
    this.recipes.set(recipe.id, recipe);
  }

  /**
   * Get recipe by ID
   */
  getRecipe(recipeId: string): CraftingRecipe | null {
    return this.recipes.get(recipeId) || null;
  }

  /**
   * Get all recipes for a station
   */
  getRecipesByStation(station: CraftingStation): CraftingRecipe[] {
    return Array.from(this.recipes.values()).filter(r => r.station === station);
  }

  /**
   * Check if player can craft a recipe
   */
  canCraft(recipeId: string): boolean {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return false;

    // Check ingredients
    for (const ingredient of recipe.ingredients) {
      if (!this.inventory.hasItem(ingredient.itemId, ingredient.count)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Craft a recipe
   */
  craft(recipeId: string): boolean {
    if (!this.canCraft(recipeId)) return false;

    const recipe = this.recipes.get(recipeId);
    if (!recipe) return false;

    // Remove ingredients
    for (const ingredient of recipe.ingredients) {
      this.inventory.removeItem(ingredient.itemId, ingredient.count);
    }

    // Add result
    const resultItem = this.createItem(recipe.result.itemId);
    if (resultItem) {
      this.inventory.addItem(resultItem, recipe.result.count);
    }

    return true;
  }

  /**
   * Create item by ID (simplified - would normally load from database)
   */
  private createItem(itemId: string): Item | null {
    // This is a simplified version - in production, load from item database
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
      cooked_meat: {
        id: 'cooked_meat',
        name: 'Cooked Meat',
        description: 'Restores health',
        type: ItemType.CONSUMABLE,
        value: 10,
        stackable: true,
        maxStack: 10,
      },
      hearty_stew: {
        id: 'hearty_stew',
        name: 'Hearty Stew',
        description: 'Restores health and stamina',
        type: ItemType.CONSUMABLE,
        value: 25,
        stackable: true,
        maxStack: 5,
      },
      bread: {
        id: 'bread',
        name: 'Bread',
        description: 'Simple bread',
        type: ItemType.CONSUMABLE,
        value: 5,
        stackable: true,
        maxStack: 20,
      },
    };

    return items[itemId] || null;
  }

  /**
   * Get all recipes
   */
  getAllRecipes(): CraftingRecipe[] {
    return Array.from(this.recipes.values());
  }
}
