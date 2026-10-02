/**
 * Debug console — in-game command line
 * Engine layer — never imports game
 */

export type CommandHandler = (args: string[]) => string;

export class DebugConsole {
  private commands = new Map<string, CommandHandler>();
  private history: string[] = [];
  private visible = false;
  private container: HTMLDivElement | null = null;
  private output: HTMLDivElement | null = null;
  private input: HTMLInputElement | null = null;

  constructor() {
    this.registerDefaultCommands();
    this.createUI();
  }

  private registerDefaultCommands(): void {
    this.registerCommand('help', () => {
      const cmds = Array.from(this.commands.keys()).join(', ');
      return `Available commands: ${cmds}`;
    });

    this.registerCommand('clear', () => {
      if (this.output) {
        this.output.innerHTML = '';
      }
      return '';
    });

    this.registerCommand('stats', () => {
      return `Debug console active. Use 'help' for commands.`;
    });
  }

  private createUI(): void {
    this.container = document.createElement('div');
    this.container.id = 'debug-console';
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.9);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      display: none;
      z-index: 10000;
      max-height: 300px;
    `;

    this.output = document.createElement('div');
    this.output.style.cssText = `
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 10px;
    `;

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Enter command...';
    this.input.style.cssText = `
      width: 100%;
      background: #111;
      color: #0f0;
      border: 1px solid #333;
      padding: 5px;
      font-family: monospace;
    `;

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.executeCommand(this.input!.value);
        this.input!.value = '';
      }
    });

    this.container.appendChild(this.output);
    this.container.appendChild(this.input);
    document.body.appendChild(this.container);

    // Toggle with backtick
    window.addEventListener('keydown', (e) => {
      if (e.key === '`') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  registerCommand(name: string, handler: CommandHandler): void {
    this.commands.set(name, handler);
  }

  private executeCommand(cmd: string): void {
    const parts = cmd.trim().split(' ');
    const command = parts[0] ?? '';
    const args = parts.slice(1);

    this.log(`> ${cmd}`);
    this.history.push(cmd);

    const handler = this.commands.get(command);
    if (handler) {
      const result = handler(args);
      if (result) {
        this.log(result);
      }
    } else {
      this.log(`Unknown command: ${command}`);
    }
  }

  log(message: string): void {
    if (this.output) {
      const line = document.createElement('div');
      line.textContent = message;
      this.output.appendChild(line);
      this.output.scrollTop = this.output.scrollHeight;
    }
  }

  toggle(): void {
    this.visible = !this.visible;
    if (this.container) {
      this.container.style.display = this.visible ? 'block' : 'none';
      if (this.visible && this.input) {
        this.input.focus();
      }
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    if (this.container) {
      this.container.remove();
    }
  }
}

export function createDebugConsole(): DebugConsole {
  return new DebugConsole();
}
