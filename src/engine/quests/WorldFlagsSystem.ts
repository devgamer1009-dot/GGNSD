/**
 * World Flags System
 * P15 - Persistent world state flags
 */

export class WorldFlagsSystem {
  private flags: Set<string> = new Set();

  /**
   * Set a flag
   */
  setFlag(flag: string): void {
    this.flags.add(flag);
  }

  /**
   * Unset a flag
   */
  unsetFlag(flag: string): void {
    this.flags.delete(flag);
  }

  /**
   * Check if flag is set
   */
  hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  /**
   * Check if all flags are set
   */
  hasAllFlags(flags: string[]): boolean {
    return flags.every(flag => this.flags.has(flag));
  }

  /**
   * Check if any flag is set
   */
  hasAnyFlag(flags: string[]): boolean {
    return flags.some(flag => this.flags.has(flag));
  }

  /**
   * Get all flags
   */
  getAllFlags(): string[] {
    return Array.from(this.flags);
  }

  /**
   * Clear all flags
   */
  clear(): void {
    this.flags.clear();
  }

  /**
   * Export flags for saving
   */
  export(): string[] {
    return this.getAllFlags();
  }

  /**
   * Import flags from save
   */
  import(flags: string[]): void {
    this.flags = new Set(flags);
  }
}
