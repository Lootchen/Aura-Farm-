export const DRAFT_MODULES = Object.freeze([
  {
    id: "twin-shot",
    family: "shot",
    kind: "multiplication",
    icon: "Ⅱ",
    title: "Gemela",
    effect: "+1 ORB",
    desc: "Cada PERFECT dispara una bola extra."
  },
  {
    id: "ricochet",
    family: "collision",
    kind: "rule",
    icon: "↗",
    title: "Rebote",
    effect: "+1 REBOTE",
    desc: "Tus proyectiles sobreviven a otra pared."
  },
  {
    id: "pierce",
    family: "collision",
    kind: "rule",
    icon: "➞",
    title: "Perfora",
    effect: "+1 BLANCO",
    desc: "Atraviesa una nota y sigue volando."
  },
  {
    id: "fragments",
    family: "explosion",
    kind: "multiplication",
    icon: "✣",
    title: "Astillas",
    effect: "+FRAGMENTOS",
    desc: "Las explosiones escupen nuevas bolas."
  },
  {
    id: "bumper",
    family: "arena",
    kind: "topology",
    icon: "◉",
    title: "Bumper",
    effect: "+OBSTÁCULO",
    desc: "Añade un reflector físico al tablero.",
    maxLevel: 3
  },
  {
    id: "nova",
    family: "slide",
    kind: "conversion",
    icon: "✹",
    title: "Nova",
    effect: "+2 POWER",
    desc: "Cada Slide termina en una salva mayor."
  },
  {
    id: "mirror-slide",
    family: "slide",
    kind: "multiplication",
    icon: "◇",
    title: "Espejo",
    effect: "DOBLE GARRA",
    desc: "Un Slide también dispara desde la otra garra."
  },
  {
    id: "chain-relay",
    family: "chain",
    kind: "conversion",
    icon: "↯",
    title: "Relevo",
    effect: "CHAIN → ORB",
    desc: "Cada CHAIN continúa con un nuevo proyectil."
  },
  {
    id: "shockwave",
    family: "explosion",
    kind: "conversion",
    icon: "◎",
    title: "Shock",
    effect: "POWER AOE",
    desc: "Las explosiones Power barren notas normales y rompen escudos cercanos."
  },
  {
    id: "fusion",
    family: "collision",
    kind: "conversion",
    icon: "✦",
    title: "Fusión",
    effect: "ORB × ORB",
    desc: "Choques entre proyectiles detonan como Power."
  },
  {
    id: "wall-charge",
    family: "wall",
    kind: "conversion",
    icon: "⬡",
    title: "Carga",
    effect: "PARED → POWER",
    desc: "Los impactos de pared detonan como Power.",
    maxLevel: 1
  },
  {
    id: "bumper-split",
    family: "arena",
    kind: "multiplication",
    icon: "⋔",
    title: "Duplicador",
    effect: "BUMPER ×2",
    desc: "El primer rebote en bumper duplica la bola.",
    maxLevel: 1,
    requiresActive: ["bumper"]
  },
  {
    id: "combo-shield",
    family: "defense",
    kind: "defense",
    icon: "▱",
    title: "Shield",
    effect: "SALVA 1",
    desc: "El próximo MISS no rompe tu combo."
  }
].map((module) => Object.freeze(module)));

export const BUILD_SYNERGIES = Object.freeze([
  {
    id: "pinball-engine",
    title: "PINBALL",
    requires: ["bumper", "bumper-split", "ricochet"],
    desc: "Bumper + duplicación + rebotes."
  },
  {
    id: "wallstorm",
    title: "WALLSTORM",
    requires: ["ricochet", "wall-charge", "shockwave"],
    desc: "Las paredes alimentan detonaciones AOE."
  },
  {
    id: "chain-reactor",
    title: "CHAIN REACTOR",
    requires: ["chain-relay", "fragments", "fusion"],
    desc: "Las cadenas generan materia para nuevas colisiones."
  },
  {
    id: "twin-nova",
    title: "TWIN NOVA",
    requires: ["nova", "mirror-slide"],
    desc: "Los Slides cierran con salvas simétricas."
  },
  {
    id: "needle-storm",
    title: "NEEDLE STORM",
    requires: ["twin-shot", "pierce", "fragments"],
    desc: "Más proyectiles que atraviesan y se multiplican."
  },
  {
    id: "core-breaker",
    title: "CORE BREAKER",
    requires: ["pierce", "fusion", "shockwave"],
    desc: "Build orientada a abrir y castigar objetivos duros."
  }
].map((synergy) =>
  Object.freeze({
    ...synergy,
    requires: Object.freeze(
      [...synergy.requires]
    )
  })
));

export function moduleMaxLevelFor(
  module,
  defaultMaxLevel = 3
) {
  if (!module) {
    return defaultMaxLevel;
  }

  return Math.max(
    1,
    Number(
      module.maxLevel ??
      defaultMaxLevel
    ) || defaultMaxLevel
  );
}

export function moduleAvailableForDraft(
  module,
  {
    activeIds = []
  } = {}
) {
  const requires =
    module?.requiresActive;

  if (
    !Array.isArray(requires) ||
    requires.length === 0
  ) {
    return true;
  }

  const active =
    new Set(activeIds);

  return requires.every(
    (id) => active.has(id)
  );
}

export function simulatedActiveIdsForDraftUpgrade(
  module,
  {
    activeIds = [],
    reserveIds = [],
    activeLimit = 4
  } = {}
) {
  const ids =
    [...activeIds];

  if (
    ids.includes(module.id) ||
    reserveIds.includes(module.id)
  ) {
    return ids;
  }

  if (ids.length < activeLimit) {
    ids.push(module.id);
  }

  return ids;
}

export function draftSynergyHints(
  module,
  {
    synergies = BUILD_SYNERGIES,
    activeIds = [],
    reserveIds = [],
    activeLimit = 4
  } = {}
) {
  const current =
    new Set(
      synergies
        .filter(
          (synergy) =>
            synergy.requires.every(
              (id) =>
                activeIds.includes(id)
            )
        )
        .map(
          (synergy) => synergy.id
        )
    );
  const simulated =
    new Set(
      simulatedActiveIdsForDraftUpgrade(
        module,
        {
          activeIds,
          reserveIds,
          activeLimit
        }
      )
    );

  return synergies.filter(
    (synergy) =>
      !current.has(synergy.id) &&
      synergy.requires.every(
        (id) => simulated.has(id)
      )
  );
}

function shuffledWithRandom(
  items,
  random
) {
  const copy =
    [...items];

  for (
    let index = copy.length - 1;
    index > 0;
    index -= 1
  ) {
    const pick =
      Math.floor(
        random() *
        (index + 1)
      );
    [copy[index], copy[pick]] =
      [copy[pick], copy[index]];
  }

  return copy;
}

export function pickDraftChoices({
  modules = DRAFT_MODULES,
  synergies = BUILD_SYNERGIES,
  random = Math.random,
  levelFor = () => 0,
  activeIds = [],
  reserveIds = [],
  activeLimit = 4,
  defaultMaxLevel = 3
} = {}) {
  const moduleById =
    new Map(
      modules.map(
        (module) => [
          module.id,
          module
        ]
      )
    );
  const roles =
    new Map();
  const pool =
    shuffledWithRandom(
      modules.filter(
        (module) =>
          Number(
            levelFor(module.id) ||
            0
          ) <
            moduleMaxLevelFor(
              module,
              defaultMaxLevel
            ) &&
          moduleAvailableForDraft(
            module,
            {
              activeIds
            }
          )
      ),
      random
    );
  const choices = [];
  const usedFamilies =
    new Set();
  const ownedFamilies =
    new Set(
      activeIds
        .map(
          (id) =>
            moduleById.get(id)
              ?.family
        )
        .filter(Boolean)
    );

  const add = (
    module,
    {
      allowFamilyRepeat = false,
      role = "variety"
    } = {}
  ) => {
    if (
      !module ||
      choices.includes(module)
    ) {
      return false;
    }

    if (
      !allowFamilyRepeat &&
      usedFamilies.has(
        module.family
      )
    ) {
      return false;
    }

    choices.push(module);
    usedFamilies.add(
      module.family
    );
    roles.set(
      module.id,
      role
    );
    return true;
  };

  const finishers =
    pool.filter(
      (module) =>
        draftSynergyHints(
          module,
          {
            synergies,
            activeIds,
            reserveIds,
            activeLimit
          }
        ).length > 0
    );

  if (finishers.length > 0) {
    add(
      finishers[0],
      {
        role: "synergy"
      }
    );
  }

  if (
    activeIds.length > 0 &&
    choices.length < 2
  ) {
    const continuation =
      pool.find(
        (module) =>
          ownedFamilies.has(
            module.family
          ) &&
          !choices.includes(
            module
          )
      );

    add(
      continuation,
      {
        allowFamilyRepeat:
          choices.length === 0,
        role: "continuation"
      }
    );
  }

  if (choices.length < 3) {
    const discovery =
      pool.find(
        (module) =>
          !ownedFamilies.has(
            module.family
          ) &&
          !choices.includes(
            module
          ) &&
          !usedFamilies.has(
            module.family
          )
      );

    add(
      discovery,
      {
        role: "discovery"
      }
    );
  }

  for (const module of pool) {
    if (choices.length >= 3) {
      break;
    }

    add(
      module,
      {
        role: "variety"
      }
    );
  }

  for (const module of pool) {
    if (choices.length >= 3) {
      break;
    }

    add(
      module,
      {
        allowFamilyRepeat: true,
        role: "fallback"
      }
    );
  }

  return {
    choices,
    roles
  };
}

function seededRandom(
  seed
) {
  let state =
    (Number(seed) >>> 0) || 1;

  return () => {
    let x =
      state >>> 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    state = x >>> 0;
    return state / 4294967296;
  };
}

function acquireAuditModule(
  state,
  module,
  {
    activeLimit,
    reserveLimit,
    defaultMaxLevel
  }
) {
  const current =
    Number(
      state.levels.get(
        module.id
      ) || 0
    );
  const next =
    Math.min(
      moduleMaxLevelFor(
        module,
        defaultMaxLevel
      ),
      current + 1
    );

  state.levels.set(
    module.id,
    next
  );

  if (current === 0) {
    if (
      state.activeIds.length <
      activeLimit
    ) {
      state.activeIds.push(
        module.id
      );
    } else if (
      state.reserveIds.length <
      reserveLimit
    ) {
      state.reserveIds.push(
        module.id
      );
    }
  }
}

function chooseAuditModule(
  result,
  policy
) {
  const byRole =
    (role) =>
      result.choices.find(
        (module) =>
          result.roles.get(
            module.id
          ) === role
      );

  if (policy === "synergy") {
    return (
      byRole("synergy") ||
      byRole("continuation") ||
      result.choices[0]
    );
  }

  if (policy === "discovery") {
    return (
      byRole("discovery") ||
      byRole("variety") ||
      result.choices[
        result.choices.length - 1
      ]
    );
  }

  return result.choices[0];
}

function auditBuildSignature(
  state
) {
  return [...state.levels]
    .filter(
      ([, level]) =>
        Number(level) > 0
    )
    .sort(
      ([a], [b]) =>
        a.localeCompare(b)
    )
    .map(
      ([id, level]) =>
        `${id}@${level}`
    )
    .join("+");
}

function incrementMap(
  map,
  key,
  amount = 1
) {
  map.set(
    key,
    Number(
      map.get(key) || 0
    ) + amount
  );
}

export function auditDraftSeeds({
  seedCount = 1024,
  seedBase = 1,
  drafts = 3,
  activeLimit = 4,
  reserveLimit = 4,
  defaultMaxLevel = 3
} = {}) {
  const policies =
    [
      "front",
      "synergy",
      "discovery"
    ];
  const offered =
    new Map();
  const offeredRoles =
    new Map();
  let totalOfferSlots = 0;
  let shortOfferSteps = 0;
  const policyReports = {};

  for (const policy of policies) {
    const builds =
      new Map();
    const chosenRoles =
      new Map();
    let completedSynergyRuns = 0;

    for (
      let index = 0;
      index < seedCount;
      index += 1
    ) {
      const state = {
        levels: new Map(),
        activeIds: [],
        reserveIds: []
      };
      const random =
        seededRandom(
          seedBase + index
        );

      for (
        let draft = 0;
        draft < drafts;
        draft += 1
      ) {
        const result =
          pickDraftChoices({
            modules:
              DRAFT_MODULES,
            synergies:
              BUILD_SYNERGIES,
            random,
            levelFor:
              (id) =>
                state.levels.get(id) ||
                0,
            activeIds:
              state.activeIds,
            reserveIds:
              state.reserveIds,
            activeLimit,
            defaultMaxLevel
          });

        if (
          result.choices.length < 3
        ) {
          shortOfferSteps += 1;
        }

        for (
          const module of
          result.choices
        ) {
          incrementMap(
            offered,
            module.id
          );
          incrementMap(
            offeredRoles,
            result.roles.get(
              module.id
            ) || "unknown"
          );
          totalOfferSlots += 1;
        }

        const chosen =
          chooseAuditModule(
            result,
            policy
          );

        if (!chosen) {
          continue;
        }

        incrementMap(
          chosenRoles,
          result.roles.get(
            chosen.id
          ) || "unknown"
        );

        acquireAuditModule(
          state,
          chosen,
          {
            activeLimit,
            reserveLimit,
            defaultMaxLevel
          }
        );
      }

      const signature =
        auditBuildSignature(
          state
        );
      incrementMap(
        builds,
        signature
      );

      const active =
        new Set(
          state.activeIds
        );
      if (
        BUILD_SYNERGIES.some(
          (synergy) =>
            synergy.requires.every(
              (id) => active.has(id)
            )
        )
      ) {
        completedSynergyRuns += 1;
      }
    }

    const orderedBuilds =
      [...builds.entries()]
        .sort(
          (a, b) =>
            b[1] - a[1]
        );
    const top =
      orderedBuilds[0] ?? [
        "",
        0
      ];

    policyReports[policy] = {
      uniqueBuilds:
        builds.size,
      topBuild:
        top[0],
      topBuildShare:
        Number(
          (
            top[1] /
            Math.max(
              1,
              seedCount
            )
          ).toFixed(4)
        ),
      synergyCompletionRate:
        Number(
          (
            completedSynergyRuns /
            Math.max(
              1,
              seedCount
            )
          ).toFixed(4)
        ),
      chosenRoles:
        Object.fromEntries(
          [...chosenRoles]
            .sort(
              (a, b) =>
                b[1] - a[1]
            )
        )
    };
  }

  const offeredModules =
    DRAFT_MODULES
      .map(
        (module) => ({
          id: module.id,
          offers:
            Number(
              offered.get(
                module.id
              ) || 0
            ),
          share:
            Number(
              (
                Number(
                  offered.get(
                    module.id
                  ) || 0
                ) /
                Math.max(
                  1,
                  totalOfferSlots
                )
              ).toFixed(4)
            )
        })
      )
      .sort(
        (a, b) =>
          b.offers - a.offers
      );
  const warnings = [];

  if (
    offeredModules.some(
      (module) =>
        module.offers === 0
    )
  ) {
    warnings.push(
      "Hay módulos que nunca aparecen en la muestra."
    );
  }

  if (shortOfferSteps > 0) {
    warnings.push(
      `${shortOfferSteps} drafts ofrecieron menos de 3 opciones.`
    );
  }

  for (
    const [policy, report] of
    Object.entries(
      policyReports
    )
  ) {
    if (
      report.uniqueBuilds < 24
    ) {
      warnings.push(
        `${policy}: sólo ${report.uniqueBuilds} builds finales únicas.`
      );
    }

    if (
      policy !== "synergy" &&
      report.topBuildShare > 0.18
    ) {
      warnings.push(
        `${policy}: la build más común alcanza ${Math.round(report.topBuildShare * 100)}%.`
      );
    }
  }

  const fallbackOffers =
    Number(
      offeredRoles.get(
        "fallback"
      ) || 0
    );
  const fallbackRate =
    Number(
      (
        fallbackOffers /
        Math.max(
          1,
          totalOfferSlots
        )
      ).toFixed(4)
    );

  if (fallbackRate > 0.10) {
    warnings.push(
      `Fallback alto: ${Math.round(fallbackRate * 100)}% de slots.`
    );
  }

  return {
    ok:
      warnings.length === 0,
    seedCount,
    drafts,
    policies:
      policyReports,
    offeredModules,
    offeredRoles:
      Object.fromEntries(
        [...offeredRoles]
          .sort(
            (a, b) =>
              b[1] - a[1]
          )
      ),
    fallbackRate,
    shortOfferSteps,
    warnings
  };
}
