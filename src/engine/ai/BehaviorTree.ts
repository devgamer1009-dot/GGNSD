/**
 * Behavior Tree System
 * P14 - AI decision making using behavior trees
 */

export enum NodeStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running',
}

export interface Blackboard {
  [key: string]: any;
}

export abstract class BehaviorNode {
  protected blackboard: Blackboard;

  constructor(blackboard: Blackboard) {
    this.blackboard = blackboard;
  }

  abstract tick(deltaTime: number): NodeStatus;
}

export class Sequence extends BehaviorNode {
  private children: BehaviorNode[];
  private currentIndex: number = 0;

  constructor(blackboard: Blackboard, children: BehaviorNode[]) {
    super(blackboard);
    this.children = children;
  }

  tick(deltaTime: number): NodeStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex]!.tick(deltaTime);

      if (status === NodeStatus.FAILURE) {
        this.currentIndex = 0;
        return NodeStatus.FAILURE;
      }

      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }

      this.currentIndex++;
    }

    this.currentIndex = 0;
    return NodeStatus.SUCCESS;
  }
}

export class Selector extends BehaviorNode {
  private children: BehaviorNode[];
  private currentIndex: number = 0;

  constructor(blackboard: Blackboard, children: BehaviorNode[]) {
    super(blackboard);
    this.children = children;
  }

  tick(deltaTime: number): NodeStatus {
    while (this.currentIndex < this.children.length) {
      const status = this.children[this.currentIndex]!.tick(deltaTime);

      if (status === NodeStatus.SUCCESS) {
        this.currentIndex = 0;
        return NodeStatus.SUCCESS;
      }

      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }

      this.currentIndex++;
    }

    this.currentIndex = 0;
    return NodeStatus.FAILURE;
  }
}

export class Action extends BehaviorNode {
  private actionFn: (blackboard: Blackboard, deltaTime: number) => NodeStatus;

  constructor(
    blackboard: Blackboard,
    actionFn: (blackboard: Blackboard, deltaTime: number) => NodeStatus
  ) {
    super(blackboard);
    this.actionFn = actionFn;
  }

  tick(deltaTime: number): NodeStatus {
    return this.actionFn(this.blackboard, deltaTime);
  }
}

export class Condition extends BehaviorNode {
  private conditionFn: (blackboard: Blackboard) => boolean;

  constructor(blackboard: Blackboard, conditionFn: (blackboard: Blackboard) => boolean) {
    super(blackboard);
    this.conditionFn = conditionFn;
  }

  tick(_deltaTime: number): NodeStatus {
    return this.conditionFn(this.blackboard) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

export class Inverter extends BehaviorNode {
  private child: BehaviorNode;

  constructor(blackboard: Blackboard, child: BehaviorNode) {
    super(blackboard);
    this.child = child;
  }

  tick(deltaTime: number): NodeStatus {
    const status = this.child.tick(deltaTime);

    if (status === NodeStatus.SUCCESS) {
      return NodeStatus.FAILURE;
    }

    if (status === NodeStatus.FAILURE) {
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }
}

export class Repeater extends BehaviorNode {
  private child: BehaviorNode;
  private maxIterations: number;
  private currentIteration: number = 0;

  constructor(blackboard: Blackboard, child: BehaviorNode, maxIterations: number = -1) {
    super(blackboard);
    this.child = child;
    this.maxIterations = maxIterations;
  }

  tick(deltaTime: number): NodeStatus {
    const status = this.child.tick(deltaTime);

    if (status === NodeStatus.RUNNING) {
      return NodeStatus.RUNNING;
    }

    this.currentIteration++;

    if (this.maxIterations > 0 && this.currentIteration >= this.maxIterations) {
      this.currentIteration = 0;
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }
}

export class RandomSelector extends BehaviorNode {
  private children: BehaviorNode[];
  private shuffledChildren: BehaviorNode[];
  private currentIndex: number = 0;

  constructor(blackboard: Blackboard, children: BehaviorNode[]) {
    super(blackboard);
    this.children = children;
    this.shuffledChildren = [...children];
    this.shuffle();
  }

  private shuffle(): void {
    for (let i = this.shuffledChildren.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledChildren[i], this.shuffledChildren[j]] = [
        this.shuffledChildren[j]!,
        this.shuffledChildren[i]!,
      ];
    }
  }

  tick(deltaTime: number): NodeStatus {
    while (this.currentIndex < this.shuffledChildren.length) {
      const status = this.shuffledChildren[this.currentIndex]!.tick(deltaTime);

      if (status === NodeStatus.SUCCESS) {
        this.currentIndex = 0;
        this.shuffle();
        return NodeStatus.SUCCESS;
      }

      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }

      this.currentIndex++;
    }

    this.currentIndex = 0;
    this.shuffle();
    return NodeStatus.FAILURE;
  }
}
