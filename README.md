# Aura Farm — Vertical Slice v0.24

**BUILD THE BEAT.**

Aura Farm ya no se plantea como un rhythm game tradicional con una lista creciente de tipos de nota. La vertical slice prueba un núcleo de **rhythm-action roguelite / hybrid arcade**:

> Golpea al ritmo → la nota sobrevive como proyectil → modifica físicamente las notas futuras → construye una máquina musical diferente durante la run.

## Run

Una run completa tiene **7 actos**.

- Cada acto usa 68 beats a 110 BPM (~37 s de gameplay).
- Entre los actos 1–6 se elige una de tres mejoras.
- Con count-ins y decisiones, una run completa queda aproximadamente en la franja de 4–5 minutos.
- El acto 7 activa **AURA CORE**, un boss/reactor físico que recibe daño de los proyectiles.
- Al terminar se muestra resumen de score, PERFECT, CHAIN, MISS, daño al Core y build.

## Core

### Tap

- Contacto físico de pinza con bola = PERFECT.
- Si no hay contacto, MISS.
- La bola acertada se transforma en proyectil a velocidad constante.
- Los proyectiles interactúan con notas, paredes, bumpers, otros proyectiles y AURA CORE.

### CHAIN intencional

El chart puede declarar `chainGroup`.

- Las notas del mismo grupo muestran un aro amarillo y una conexión discontinua.
- El objetivo es que el jugador empiece a prever trayectorias y busque cadenas deliberadamente.
- Los actos 3, 5 y 7 añaden capas extra de notas para que el mismo tema se vuelva más denso durante la run.

### Slide experimental

El chart sigue comparando dos modelos:

- **TRACE · DEDO**: el dedo mueve directamente la punta de la garra sobre el riel.
- **FOLLOW · STICK**: la palanca funciona como velocidad 2D; izquierda desplaza la garra a la izquierda, sin mapping angular absoluto.

La telemetría local registra intentos y éxitos de ambos modos para orientar la siguiente decisión de diseño.

## Build / upgrades

Las cartas son cambios visibles de reglas, no estadísticas abstractas.

Pool actual:

- Gemela
- Rebote
- Perfora
- Astillas
- Bumper
- Nova
- Espejo
- Relevo
- Shock
- Fusión
- Carga
- Duplicador
- Shield

Las opciones intentan pertenecer a familias distintas. Las familias tienen color consistente tanto en selección como en resumen.

## Música reactiva

La Web Audio API sigue siendo el reloj maestro, pero la música ya reacciona a la build.

- La densidad del groove aumenta con los actos y el número de upgrades.
- Upgrades de Slide añaden una capa lead.
- Upgrades de explosión/fusión/pared añaden pulsos de Aura.
- Gemela/Relevo/Duplicador añaden clicks rítmicos.
- El acto 7 añade un drone específico del boss.
- CHAIN produce una respuesta tonal ascendente.

Esto permite probar la tesis de producto: **la misma canción debe sonar distinta cuando la build crece**.

## Identidad visual

La arena deja de ser únicamente “fondo oscuro + neón”.

- Chasis y raíles laterales de una máquina musical.
- Energía reactiva al beat y progreso de acto integrado en el escenario.
- Brazos mecánicos con actuador, junta y pinza física.
- Boss/reactor central en el último acto.
- Tres máquinas cosméticas con paleta propia:
  - FORGE — inicial.
  - PRISM — desbloqueada tras completar 1 run.
  - PULSE — desbloqueada tras completar 3 runs.

Estas máquinas son progresión cosmética, no poder estadístico.

## Daily

**DAILY SEED** usa una semilla determinista derivada de la fecha local.

- El orden aleatorio de mejoras es reproducible para esa fecha.
- Se guarda el mejor Daily del día en el dispositivo.
- Es la base técnica para una futura Daily Run compartida/leaderboard sin introducir todavía backend.

## Calibración

La pantalla inicial expone controles táctiles de offset.

- ±15 ms desde UI.
- `[` / `]` ajustan ±5 ms desde teclado.
- El ajuste se guarda localmente.
- Bluetooth sigue requiriendo calibración manual; no se oculta esa limitación.

## Métricas locales

No se envían datos a ningún servidor.

Se guardan localmente:

- runs iniciadas/completadas;
- total de CHAIN;
- intentos/éxitos TRACE;
- intentos/éxitos FOLLOW;
- best score;
- Daily best;
- runs completadas para unlocks.

El objetivo es aprender del core antes de construir analytics remotos, monetización o live ops.

## Chart data-driven

`charts/tap-lab.json` admite:

- `tap`
- `slide`
- `mode: trace | follow`
- `chainGroup`
- `minAct: 1..7`

El chart actual tiene 41 eventos totales, con capas adicionales para actos 3, 5 y 7.

## Física

Regla no negociable:

**las bolas se mueven con velocidad constante entre colisiones.**

Sin gravedad, aceleración ni easing jugable.

## Qué debe validar esta slice

1. ¿Tap → proyectil → CHAIN genera decisiones intencionales?
2. ¿La build cambia realmente cómo se juega y cómo suena la run?
3. ¿TRACE o FOLLOW merece convertirse en el Slide definitivo?
4. ¿El acto 7 produce suficiente clímax?
5. ¿Terminar una run da ganas de empezar otra?
6. ¿FORGE/PRISM/PULSE empiezan a construir una identidad visual propia?

## GitHub Pages

Fuente de verdad: `main`.

https://lootchen.github.io/Aura-Farm-/
