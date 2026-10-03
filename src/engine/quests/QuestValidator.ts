/**
 * Quest Validator
 * P15 - Validates quest graphs for correctness
 */

import { Quest, QuestStep, QuestStepType } from '../../content/quests/schema.js';

export interface ValidationError {
  questId: string;
  stepId: string;
  message: string;
}

export interface QuestValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class QuestValidator {
  /**
   * Validate a quest
   */
  validate(quest: Quest): QuestValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check quest has steps
    if (!quest.steps || quest.steps.length === 0) {
      errors.push({
        questId: quest.id,
        stepId: '',
        message: 'Quest has no steps',
      });
      return { valid: false, errors, warnings };
    }

    // Check current step exists
    if (!quest.steps.find(s => s.id === quest.currentStepId)) {
      errors.push({
        questId: quest.id,
        stepId: quest.currentStepId,
        message: 'Current step ID does not exist in steps',
      });
    }

    // Check all step references are valid
    this.validateStepReferences(quest, errors);

    // Check for unreachable steps
    this.validateReachability(quest, errors, warnings);

    // Check for missing targets
    this.validateTargets(quest, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate step references
   */
  private validateStepReferences(quest: Quest, errors: ValidationError[]): void {
    const stepIds = new Set(quest.steps.map(s => s.id));

    for (const step of quest.steps) {
      // Check nextStepId exists
      if (step.nextStepId && !stepIds.has(step.nextStepId)) {
        errors.push({
          questId: quest.id,
          stepId: step.id,
          message: `nextStepId "${step.nextStepId}" does not exist`,
        });
      }

      // Check choice nextStepIds exist
      if (step.choices) {
        for (const choice of step.choices) {
          if (choice.nextStepId && !stepIds.has(choice.nextStepId)) {
            errors.push({
              questId: quest.id,
              stepId: step.id,
              message: `Choice "${choice.id}" nextStepId "${choice.nextStepId}" does not exist`,
            });
          }
        }
      }
    }
  }

  /**
   * Validate step reachability
   */
  private validateReachability(
    quest: Quest,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const reachable = new Set<string>();
    const queue = [quest.steps[0]!.id]; // Start from first step

    while (queue.length > 0) {
      const stepId = queue.shift()!;
      if (reachable.has(stepId)) continue;

      reachable.add(stepId);
      const step = quest.steps.find(s => s.id === stepId);
      if (!step) continue;

      // Add next steps to queue
      if (step.nextStepId) {
        queue.push(step.nextStepId);
      }

      // Add choice next steps
      if (step.choices) {
        for (const choice of step.choices) {
          if (choice.nextStepId) {
            queue.push(choice.nextStepId);
          }
        }
      }
    }

    // Check for unreachable steps
    for (const step of quest.steps) {
      if (!reachable.has(step.id)) {
        warnings.push({
          questId: quest.id,
          stepId: step.id,
          message: `Step "${step.id}" is unreachable`,
        });
      }
    }
  }

  /**
   * Validate step targets
   */
  private validateTargets(quest: Quest, warnings: ValidationError[]): void {
    for (const step of quest.steps) {
      const needsTarget = [
        QuestStepType.TALK_TO,
        QuestStepType.GO_TO,
        QuestStepType.KILL,
        QuestStepType.COLLECT,
        QuestStepType.DELIVER,
      ];

      if (needsTarget.includes(step.type) && !step.target) {
        warnings.push({
          questId: quest.id,
          stepId: step.id,
          message: `Step type "${step.type}" requires a target`,
        });
      }

      if (step.type === QuestStepType.KILL && !step.count) {
        warnings.push({
          questId: quest.id,
          stepId: step.id,
          message: 'Kill step should have a count',
        });
      }

      if (step.type === QuestStepType.COLLECT && !step.count) {
        warnings.push({
          questId: quest.id,
          stepId: step.id,
          message: 'Collect step should have a count',
        });
      }
    }
  }

  /**
   * Validate multiple quests
   */
  validateAll(quests: Quest[]): QuestValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    for (const quest of quests) {
      const result = this.validate(quest);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }
}
