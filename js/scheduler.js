// SM-2 Spaced Repetition Scheduler
// Implements Anki's scheduling algorithm

const Scheduler = {
  // Default deck configuration
  defaults: {
    learningSteps: [1, 10],        // minutes: [1, 10]
    relearningSteps: [10],          // minutes
    graduatingIntervalGood: 1,     // days
    graduatingIntervalEasy: 4,     // days
    initialEase: 2500,             // * 1000
    easyMultiplier: 1.3,
    hardMultiplier: 1.2,
    intervalModifier: 1.0,
    lapseMultiplier: 0.0,          // SM-2: interval resets to 0% on lapse
    minimumLapseInterval: 1,       // days
    leechThreshold: 8,
    maxInterval: 36500,            // days
  },

  // Get the next scheduling states for a card
  getStates(card, config) {
    const cfg = { ...this.defaults, ...config };
    const now = Date.now();
    const today = Math.floor(now / 86400000);

    if (card.type === 0) {
      return this._newStates(card, cfg);
    } else if (card.type === 1 || card.type === 3) {
      return this._learningStates(card, cfg);
    } else {
      return this._reviewStates(card, cfg, now, today);
    }
  },

  _newStates(card, cfg) {
    return {
      current: { type: 'new', position: card.due },
      again: {
        type: 'learning',
        remainingSteps: cfg.learningSteps.length,
        scheduledMinutes: cfg.learningSteps[0],
      },
      hard: {
        type: 'learning',
        remainingSteps: cfg.learningSteps.length - 1,
        scheduledMinutes: cfg.learningSteps[cfg.learningSteps.length - 1] || 10,
      },
      good: this._graduatingState(cfg, 'good'),
      easy: this._graduatingState(cfg, 'easy'),
    };
  },

  _graduatingState(cfg, button) {
    if (button === 'easy') {
      return {
        type: 'review',
        scheduledDays: cfg.graduatingIntervalEasy,
        easeFactor: cfg.initialEase,
        lapses: 0,
      };
    }
    return {
      type: 'review',
      scheduledDays: cfg.graduatingIntervalGood,
      easeFactor: cfg.initialEase,
      lapses: 0,
    };
  },

  _learningStates(card, cfg) {
    const isRelearn = card.type === 3;
    const steps = isRelearn ? cfg.relearningSteps : cfg.learningSteps;
    const stepIdx = steps.length - card.left;
    const currentStep = steps[Math.max(0, stepIdx - 1)] || 1;

    const current = {
      type: isRelearn ? 'relearning' : 'learning',
      remainingSteps: card.left,
      scheduledMinutes: currentStep,
      reviewDays: isRelearn ? card.ivl : 0,
    };

    if (card.left <= 1) {
      // Last step - graduating
      if (isRelearn) {
        const newIvl = Math.max(
          cfg.minimumLapseInterval,
          Math.round(card.ivl * cfg.lapseMultiplier)
        );
        return {
          current,
          again: {
            type: 'relearning',
            remainingSteps: cfg.relearningSteps.length,
            scheduledMinutes: cfg.relearningSteps[0],
            reviewDays: card.ivl,
          },
          hard: {
            type: 'review',
            scheduledDays: Math.max(1, Math.round(newIvl * 1.2)),
            easeFactor: card.factor,
            lapses: card.lapses,
          },
          good: {
            type: 'review',
            scheduledDays: Math.max(1, newIvl),
            easeFactor: card.factor,
            lapses: card.lapses,
          },
          easy: {
            type: 'review',
            scheduledDays: Math.max(4, Math.round(newIvl * cfg.easyMultiplier)),
            easeFactor: Math.min(card.factor + 150, 5000),
            lapses: card.lapses,
          },
        };
      }
      return {
        current,
        again: {
          type: 'learning',
          remainingSteps: Math.max(1, cfg.learningSteps.length - 1),
          scheduledMinutes: cfg.learningSteps[Math.max(0, cfg.learningSteps.length - 2)] || 1,
        },
        hard: this._graduatingState(cfg, 'good'),
        good: this._graduatingState(cfg, 'good'),
        easy: this._graduatingState(cfg, 'easy'),
      };
    }

    // Still in the middle of learning steps
    const nextStepIdx = stepIdx;
    const nextMinutes = steps[nextStepIdx] || 10;
    const prevStepIdx = Math.max(0, stepIdx - 2);
    const prevMinutes = steps[prevStepIdx] || 1;

    return {
      current,
      again: {
        type: 'learning',
        remainingSteps: cfg.learningSteps.length,
        scheduledMinutes: cfg.learningSteps[0],
      },
      hard: {
        type: 'learning',
        remainingSteps: card.left - 1,
        scheduledMinutes: (currentStep + nextMinutes) / 2,
      },
      good: {
        type: 'learning',
        remainingSteps: card.left - 1,
        scheduledMinutes: nextMinutes,
      },
      easy: this._graduatingState(cfg, 'easy'),
    };
  },

  _reviewStates(card, cfg, now, today) {
    const elapsed = Math.max(0, today - card.due);
    const current = {
      type: 'review',
      scheduledDays: card.ivl,
      elapsedDays: elapsed,
      easeFactor: card.factor,
      lapses: card.lapses,
    };

    const ease = card.factor / 1000;
    const hardIvl = Math.max(card.ivl * cfg.hardMultiplier, card.ivl + 1);
    const goodIvl = Math.max(card.ivl * ease * cfg.intervalModifier, card.ivl + 1);
    const easyIvl = Math.max(card.ivl * ease * cfg.easyMultiplier, card.ivl + 4);

    const maxIvl = cfg.maxInterval;

    return {
      current,
      again: {
        type: 'relearning',
        remainingSteps: cfg.relearningSteps.length,
        scheduledMinutes: cfg.relearningSteps[0],
        reviewDays: card.ivl,
        easeFactor: Math.max(1300, card.factor - 200),
        lapses: card.lapses + 1,
      },
      hard: {
        type: 'review',
        scheduledDays: Math.min(Math.round(hardIvl), maxIvl),
        easeFactor: Math.max(1300, card.factor - 150),
        lapses: card.lapses,
      },
      good: {
        type: 'review',
        scheduledDays: Math.min(Math.round(goodIvl), maxIvl),
        easeFactor: card.factor,
        lapses: card.lapses,
      },
      easy: {
        type: 'review',
        scheduledDays: Math.min(Math.round(easyIvl), maxIvl),
        easeFactor: Math.min(card.factor + 150, 5000),
        lapses: card.lapses,
      },
    };
  },

  // Apply a rating to a card, returning the updated card
  applyRating(card, rating, states) {
    const next = states[rating];
    if (!next) return card;

    card.reps++;

    if (next.type === 'new') {
      card.type = 0;
      card.queue = 0;
      card.left = 0;
    } else if (next.type === 'learning' || next.type === 'relearning') {
      card.type = 1;
      card.queue = 1;
      card.due = Date.now() + (next.scheduledMinutes * 60 * 1000);
      card.left = next.remainingSteps || 0;
      if (next.easeFactor !== undefined) card.factor = next.easeFactor;
      if (next.lapses !== undefined) card.lapses = next.lapses;
    } else if (next.type === 'review') {
      card.type = 2;
      card.queue = 2;
      const today = Math.floor(Date.now() / 86400000);
      card.due = today + Math.max(1, next.scheduledDays);
      card.ivl = next.scheduledDays;
      if (next.easeFactor !== undefined) card.factor = next.easeFactor;
      if (next.lapses !== undefined) card.lapses = next.lapses;
      card.left = 0;
    }

    // Check for leech
    if (card.lapses >= (Scheduler.defaults.leechThreshold)) {
      card.queue = -1; // suspend leeches
    }

    return card;
  },

  // Format interval for display on answer buttons
  formatInterval(state) {
    if (!state) return '';
    if (state.type === 'new') return '新卡片';
    if (state.type === 'learning' || state.type === 'relearning') {
      const mins = state.scheduledMinutes;
      if (mins < 1) return '<1分钟';
      if (mins < 60) return `${Math.round(mins)}分钟`;
      const hours = mins / 60;
      if (hours < 24) return `${hours.toFixed(1)}小时`;
      return `${Math.round(hours / 24)}天`;
    }
    if (state.type === 'review') {
      const days = state.scheduledDays;
      if (days < 1) return '<1天';
      if (days < 30) return `${days}天`;
      if (days < 365) return `${(days / 30).toFixed(1)}月`;
      return `${(days / 365).toFixed(1)}年`;
    }
    return '';
  }
};
