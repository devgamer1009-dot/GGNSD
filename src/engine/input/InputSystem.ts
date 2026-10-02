/**
 * Input system — keyboard, mouse, gamepad, named actions
 * Engine layer — never imports game
 */

export type ActionName = string;

export interface InputBinding {
  key?: string;
  mouseButton?: number;
  gamepadButton?: number;
  gamepadAxis?: { axis: number; direction: 1 | -1 };
}

export interface InputState {
  actions: Map<ActionName, boolean>;
  axes: Map<string, number>;
}

export class InputSystem {
  private bindings = new Map<ActionName, InputBinding[]>();
  private keys = new Set<string>();
  private mouseButtons = new Set<number>();
  private gamepadButtons = new Map<number, Set<number>>();
  private gamepadAxes = new Map<number, number[]>();

  constructor() {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('mousedown', (e) => {
      this.mouseButtons.add(e.button);
    });

    window.addEventListener('mouseup', (e) => {
      this.mouseButtons.delete(e.button);
    });
  }

  bindAction(action: ActionName, binding: InputBinding): void {
    if (!this.bindings.has(action)) {
      this.bindings.set(action, []);
    }
    this.bindings.get(action)!.push(binding);
  }

  unbindAction(action: ActionName): void {
    this.bindings.delete(action);
  }

  isActionPressed(action: ActionName): boolean {
    const bindings = this.bindings.get(action);
    if (!bindings) return false;

    for (const binding of bindings) {
      if (binding.key && this.keys.has(binding.key)) return true;
      if (binding.mouseButton !== undefined && this.mouseButtons.has(binding.mouseButton)) return true;
      // Gamepad polling happens in update()
    }

    return false;
  }

  update(): void {
    // Poll gamepads
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;

      const buttons = new Set<number>();
      for (let j = 0; j < gamepad.buttons.length; j++) {
        if (gamepad.buttons[j]?.pressed) {
          buttons.add(j);
        }
      }
      this.gamepadButtons.set(i, buttons);
      this.gamepadAxes.set(i, Array.from(gamepad.axes));
    }
  }

  getState(): InputState {
    const actions = new Map<ActionName, boolean>();
    for (const action of this.bindings.keys()) {
      actions.set(action, this.isActionPressed(action));
    }

    const axes = new Map<string, number>();
    // TODO: Add axis support

    return { actions, axes };
  }

  dispose(): void {
    // Remove listeners (would need to store references)
  }
}

export function createInputSystem(): InputSystem {
  return new InputSystem();
}
