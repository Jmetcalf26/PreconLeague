// Pure deck-validation logic shared by the API and UI. No server-only imports
// so the same rules can run anywhere.

export type RuleConfig = {
  upgradeBudgetUsd: number;
  enforceColorIdentity: boolean;
  enforceSingleton: boolean;
  requireCommander: boolean;
  minDeckSize: number;
  maxDeckSize: number;
  bannedCards: string[];
};

export type DeckCardState = {
  name: string;
  quantity: number;
  isCommander: boolean;
  isBaseline: boolean;
  typeLine: string;
  colorIdentity: string[];
  priceUsd: number | null;
};

export type Violation = {
  severity: "error" | "warning";
  code: string;
  message: string;
};

export type ValidationResult = {
  ok: boolean;
  violations: Violation[];
  // Budget accounting for cards added beyond the original precon.
  budget: {
    limit: number;
    spent: number;
    remaining: number;
    unpricedCards: string[];
  };
  totals: {
    cardCount: number; // includes commander(s)
    commanderCount: number;
  };
  commanderColorIdentity: string[];
};

function isBasicLand(typeLine: string): boolean {
  const t = typeLine.toLowerCase();
  return t.includes("basic") && t.includes("land");
}

export function validateDeck(
  cards: DeckCardState[],
  rules: RuleConfig,
): ValidationResult {
  const violations: Violation[] = [];

  const commanders = cards.filter((c) => c.isCommander);
  const commanderColorIdentity = Array.from(
    new Set(commanders.flatMap((c) => c.colorIdentity)),
  ).sort();

  const cardCount = cards.reduce((sum, c) => sum + c.quantity, 0);

  // --- Commander present -----------------------------------------------------
  if (rules.requireCommander && commanders.length === 0) {
    violations.push({
      severity: "error",
      code: "no-commander",
      message: "This deck has no commander assigned.",
    });
  }

  // --- Deck size -------------------------------------------------------------
  if (cardCount < rules.minDeckSize) {
    violations.push({
      severity: "error",
      code: "too-small",
      message: `Deck has ${cardCount} cards; the minimum is ${rules.minDeckSize}.`,
    });
  }
  if (cardCount > rules.maxDeckSize) {
    violations.push({
      severity: "error",
      code: "too-big",
      message: `Deck has ${cardCount} cards; the maximum is ${rules.maxDeckSize}.`,
    });
  }

  // --- Singleton -------------------------------------------------------------
  if (rules.enforceSingleton) {
    for (const c of cards) {
      if (c.quantity > 1 && !isBasicLand(c.typeLine)) {
        violations.push({
          severity: "error",
          code: "singleton",
          message: `${c.name} appears ${c.quantity} times; Commander allows only one of each non-basic card.`,
        });
      }
    }
  }

  // --- Color identity --------------------------------------------------------
  if (rules.enforceColorIdentity && commanders.length > 0) {
    const allowed = new Set(commanderColorIdentity);
    for (const c of cards) {
      if (c.isCommander) continue;
      const outside = c.colorIdentity.filter((color) => !allowed.has(color));
      if (outside.length > 0) {
        violations.push({
          severity: "error",
          code: "color-identity",
          message: `${c.name} (${c.colorIdentity.join("") || "C"}) is outside the commander's color identity (${commanderColorIdentity.join("") || "C"}).`,
        });
      }
    }
  }

  // --- Banned cards ----------------------------------------------------------
  const banned = new Set(rules.bannedCards.map((b) => b.toLowerCase().trim()));
  for (const c of cards) {
    if (banned.has(c.name.toLowerCase())) {
      violations.push({
        severity: "error",
        code: "banned",
        message: `${c.name} is banned in this league.`,
      });
    }
  }

  // --- Upgrade budget --------------------------------------------------------
  const added = cards.filter((c) => !c.isBaseline);
  const unpricedCards: string[] = [];
  let spent = 0;
  for (const c of added) {
    if (c.priceUsd == null) {
      unpricedCards.push(c.name);
      continue;
    }
    spent += c.priceUsd * c.quantity;
  }
  spent = Math.round(spent * 100) / 100;
  const remaining = Math.round((rules.upgradeBudgetUsd - spent) * 100) / 100;

  if (spent > rules.upgradeBudgetUsd) {
    violations.push({
      severity: "error",
      code: "over-budget",
      message: `Upgrades cost $${spent.toFixed(2)}, which is over the $${rules.upgradeBudgetUsd.toFixed(2)} budget.`,
    });
  }
  if (unpricedCards.length > 0) {
    violations.push({
      severity: "warning",
      code: "unpriced",
      message: `No Scryfall price for: ${unpricedCards.join(", ")}. They are counted as $0 toward the budget.`,
    });
  }

  return {
    ok: violations.every((v) => v.severity !== "error"),
    violations,
    budget: {
      limit: rules.upgradeBudgetUsd,
      spent,
      remaining,
      unpricedCards,
    },
    totals: {
      cardCount,
      commanderCount: commanders.length,
    },
    commanderColorIdentity,
  };
}
