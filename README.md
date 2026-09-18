# Aura Farm — Vertical Slice v0.25

**BUILD THE BEAT.**

Aura Farm continúa desarrollándose como **rhythm-action roguelite / hybrid arcade**. La prioridad de v0.25 es que la vertical slice se sienta como una run con escalada, lectura y presencia, no como siete repeticiones de un laboratorio.

## Run

Una run completa mantiene **7 actos** de unos 68 beats a 110 BPM.

Los actos ahora tienen identidad propia:

1. **IGNITION** — enciende la máquina.
2. **CURRENT** — mantén el flujo.
3. **RELAY** — empieza a buscar CHAIN.
4. **OVERDRIVE** — construye momento.
5. **FRACTURE** — rompe patrones más densos.
6. **ASCENT** — prepara el clímax.
7. **AURA CORE** — boss final.

Cada acto ilumina más circuitería y celdas del chasis. La escalada visual y musical aumenta sin acelerar las bolas: el movimiento gameplay sigue siendo constante.

## Tap / proyectiles / CHAIN

- Contacto físico = PERFECT.
- La nota golpeada sobrevive como proyectil.
- Rebotes, perforaciones, fragmentos, duplicación y Power Orbs mantienen velocidades constantes.
- Los grupos `chainGroup` tienen ahora:
  - conexión discontinua;
  - chevrons de dirección;
  - objetivo líder pulsante;
  - etiqueta `CHAIN ×N` en oportunidades grandes.

La intención es que CHAIN pase de accidente espectacular a decisión previsible.

## Firmas visuales de upgrades

Las cartas todavía recibirán un rediseño visual dedicado más adelante. En gameplay, sin embargo, las mejoras empiezan a reconocerse sin leer UI:

- **Rebote** — aro/trail turquesa mientras quedan rebotes.
- **Perfora** — eje/trail rosa mientras quedan perforaciones.
- **Shock** — onda expansiva con el radio real del AOE.
- **Fusión** — anillo discontinuo violeta en detonaciones de fusión.
- **Astillas / Duplicador / Relevo** — proyectiles secundarios con símbolos y escala propios.
- **Nova / Espejo** — Power Orbs con lenguaje dorado.

## AURA CORE v0.25

El boss deja de ser únicamente una barra de vida.

### Fase 1

- Tres nodos de armadura orbitan el Core.
- Cada nodo es una hitbox física.
- Mientras quede armadura, el Core está protegido.
- Un proyectil que golpea directamente el Core protegido **rebota físicamente** conservando su velocidad.
- Romper los tres nodos expone el Core.

### Fase 2

Al bajar el Core a 50% de vida:

- la armadura se recarga;
- aumenta la velocidad orbital;
- cambia la lectura visual del reactor;
- hay una transición audiovisual/háptica clara.

Romper el Core produce el clímax de la run.

## Game feel

v0.25 introduce una jerarquía de impacto puramente visual/háptica, sin alterar el reloj maestro:

- PERFECT normal;
- PERFECT en combo alto;
- Slide PERFECT;
- CHAIN;
- explosión;
- nodo de armadura;
- cambio de fase;
- CORE BREAK.

El mundo puede hacer shake y flash, pero la simulación de notas/proyectiles no se pausa ni acelera.

## Operator Socket — base para el futuro PJ

Se añadió una presencia reactiva en el centro inferior de la máquina.

No es el personaje final. Es deliberadamente un **operator prototype** abstracto para validar si una presencia expresiva mejora vínculo y legibilidad antes de invertir en diseño definitivo.

Reacciona a:

- PERFECT;
- FLOW/combo;
- CHAIN;
- MISS;
- escudo;
- Slide;
- boss;
- victoria.

La arquitectura separa ya la reacción del operador del dibujo actual, por lo que un futuro PJ animado podrá sustituir esta silueta sin rehacer el core jugable.

## Practice

La pantalla inicial incluye **PRACTICE · 1 ACTO**.

- Dura aproximadamente un acto.
- Permite probar Tap, TRACE y FOLLOW rápidamente.
- No incrementa runs completadas.
- No desbloquea máquinas.
- No altera best score ni Daily record.
- Sí registra localmente intentos/éxitos TRACE y FOLLOW.
- El resumen de Practice muestra directamente ambos ratios.

Esto permite iterar sobre Slide sin jugar una run completa.

## Slide experimental

Seguimos comparando dos modelos, sin añadir un tercero:

### TRACE · DEDO

El dedo controla directamente la punta de la garra sobre el riel.

### FOLLOW · STICK

El joystick funciona como velocidad 2D: izquierda mueve físicamente la garra a la izquierda, derecha a la derecha, etc.

La decisión futura debe ser eliminar uno, fusionarlos sólo si existe una razón fuerte, o retirar Slide si ninguno consigue desaparecer de la cabeza del jugador.

## Música reactiva

Web Audio sigue siendo reloj maestro y generador del groove.

La mezcla responde a:

- acto actual;
- cantidad de upgrades;
- familias de build;
- CHAIN;
- boss;
- cambio de fase.

La meta sigue siendo que la misma pieza se sienta progresivamente transformada por la run.

## Máquinas / progresión

- **FORGE** — inicial.
- **PRISM** — 1 run completada.
- **PULSE** — 3 runs completadas.

Son progresión cosmética, no stat boosts.

## Daily

Daily Seed permanece determinista por fecha local y guarda Daily Best en el dispositivo. Es la base para un leaderboard futuro; aún no existe backend.

## Métricas locales

No se transmite información a servidores.

Se guardan localmente:

- sesiones;
- runs iniciadas/completadas;
- Practice iniciados/completados;
- total CHAIN;
- intentos/éxitos TRACE;
- intentos/éxitos FOLLOW;
- best score;
- Daily best;
- calibración;
- máquina seleccionada.

## Chart

El chart data-driven mantiene:

- `tap`;
- `slide`;
- `mode: trace | follow`;
- `chainGroup`;
- `minAct: 1..7`.

La densidad progresa desde 26 eventos base hasta 41 en el acto final.

## Física

Regla no negociable:

**las bolas se mueven con velocidad constante entre colisiones.**

La armadura orbitante del boss es un objeto del encuentro; no cambia la cinemática constante de bolas/notas.

## Próximas decisiones

Después de probar v0.25, las siguientes áreas de producción son:

1. decidir TRACE vs FOLLOW con sensación + métricas;
2. diseñar el PJ/operator definitivo;
3. hacer una pasada visual específica de cartas/upgrades;
4. sustituir/profundizar el groove provisional con una canción vertical-slice compuesta en stems;
5. ajustar boss/CHAIN para que las oportunidades sean intencionales y no RNG visual;
6. después estudiar backend Daily/leaderboards y contenido adicional.

## GitHub Pages

Fuente de verdad: `main`.

https://lootchen.github.io/Aura-Farm-/
