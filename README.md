# Aura Farm — Vertical Slice v0.26

**BUILD THE BEAT.**

v0.26 se centra en hacer que una run sea más legible como **build roguelite**, mejorar la continuidad móvil real y preparar el espacio del futuro personaje sin convertirlo todavía en arte final.

## Build visible durante gameplay

La build ya no desaparece después de elegir una carta.

Existe un **Build Dock** persistente bajo el HUD:

- muestra el icono de cada mejora instalada;
- agrupa stacks como `×2`, `×3`, etc.;
- usa el color de familia;
- muestra la sinergia principal activa.

Durante la pantalla de elección aparece además **TU BUILD** con:

- icono;
- nombre;
- stack;
- descripción breve;
- sinergias completadas.

El resumen final también agrupa stacks y sinergias.

## Sinergias

v0.26 reconoce combinaciones de mejoras existentes. No añade porcentajes ocultos: las sinergias describen builds que ya emergen de las reglas físicas.

Ejemplos actuales:

- **PINBALL** — Bumper + Duplicador + Rebote.
- **WALLSTORM** — Rebote + Carga + Shock.
- **CHAIN REACTOR** — Relevo + Astillas + Fusión.
- **TWIN NOVA** — Nova + Espejo.
- **NEEDLE STORM** — Gemela + Perfora + Astillas.
- **CORE BREAKER** — Perfora + Fusión + Shock.

Cuando una carta completaría una sinergia, la propia opción muestra una pista `→ NOMBRE` antes de elegirla.

Al completar una sinergia:

- aparece feedback audiovisual;
- el operador reacciona;
- algunas sinergias añaden una pequeña capa musical extra;
- no se modifica silenciosamente ninguna estadística.

## Operator / futuro PJ

La posición del operador se ha movido hacia abajo e integrado como una **cabina central entre los dos sticks**.

Esto es intencional:

- no ocupa el centro del campo jugable;
- no cruza rutas de Tap/Slide;
- no vive debajo de ninguno de los pulgares;
- funciona como HUD diegético;
- permite que el futuro PJ sea un busto/cara/cabina reactiva en vez de un cuerpo entero flotando sobre las notas.

El gráfico actual sigue siendo un placeholder reactivo. La arquitectura de estados emocionales queda preparada para sustituirlo por el personaje definitivo.

## Música / stems provisionales

El sistema procedural se acerca un paso más al futuro enfoque por stems.

Cada acto tiene ahora una pequeña identidad armónica:

- bajo y lead se transpongan progresivamente con el acto;
- entra un pad armónico al inicio de cada compás;
- la energía de la mezcla sigue creciendo con actos y upgrades;
- algunas sinergias añaden una respuesta melódica propia;
- el boss mantiene su drone específico.

Esto no sustituye una composición final. Sirve para validar la idea de que **la misma run debe sonar transformada por build + progreso** antes de producir un OST en stems.

## Mobile pause / resume

Cambiar de app, bloquear pantalla o entrar en background ya no destruye automáticamente la run.

Cuando la app pierde visibilidad durante gameplay:

- se detiene el scheduler;
- se suspende el `AudioContext`;
- `currentTime` del reloj queda congelado;
- aparece una pantalla de pausa.

Al tocar **CONTINUAR**:

- se reanuda el mismo contexto;
- se recupera el scheduler desde el mismo beat;
- no se reinicia acto, build ni score.

## AURA CORE

Se mantiene el encuentro de dos fases:

- tres nodos de armadura orbitantes;
- Core protegido mientras quede armadura;
- los impactos directos contra Core protegido rebotan conservando velocidad;
- al 50% se recarga la armadura y empieza Phase 2;
- CORE BREAK cierra la run.

## CHAIN y firmas de build

Siguen activos:

- grupos CHAIN con dirección, líder y `CHAIN ×N`;
- Rebote con firma turquesa;
- Perfora con firma rosa;
- Shock con radio AOE visible;
- Fusión con detonación diferenciada;
- Power/Nova/Espejo con lenguaje dorado.

## Practice

`PRACTICE · 1 ACTO` sigue siendo el modo rápido para evaluar:

- Tap;
- TRACE;
- FOLLOW;
- game feel.

No altera unlocks ni récords de run.

## Cartas

Las cartas **todavía no han recibido su rediseño visual definitivo**.

v0.26 sólo mejora su información:

- build actual visible;
- stacks;
- pista de sinergia;
- descripción.

La próxima pasada visual de cartas debería tratarlas como objetos del universo del juego —módulos, chips, piezas o artefactos— y no como simples botones rectangulares.

## Física

Sigue siendo no negociable:

**las notas y proyectiles se mueven a velocidad constante entre colisiones.**

Shake, flashes, operator reactions y UI no alteran el reloj ni la simulación.

## Siguiente producción

Las siguientes áreas maduras para trabajo son:

1. evaluar TRACE vs FOLLOW con Practice y telemetría local;
2. definir dirección artística y personalidad del PJ definitivo;
3. rediseñar completamente la selección de upgrades;
4. producir una primera canción real en stems;
5. continuar afinando oportunidades CHAIN y el boss;
6. sólo después ampliar contenido/backend/live ops.

## GitHub Pages

Fuente de verdad: `main`.

https://lootchen.github.io/Aura-Farm-/
