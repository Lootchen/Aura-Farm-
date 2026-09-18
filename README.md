# Aura Farm — Vertical Slice v0.27

**BUILD THE BEAT.**

v0.27 une tres frentes que ya estaban maduros: recompensa del Slide, primera identidad real del personaje/UI y una canción compuesta específicamente para la vertical slice.

## Slide Reward — POWER RETURN

Completar un Slide ya no hereda ciegamente la dirección final de la garra.

La Power Orb:

- sale a una velocidad constante propia;
- apunta hacia arriba y hacia el interior del campo;
- cruza de nuevo la zona jugable;
- tiene **1 rebote de pared garantizado**;
- suma además cualquier Rebote de la build;
- Nova mantiene su abanico de Power Orbs;
- Espejo crea la misma lógica desde la garra contraria.

La intención es que un Slide PERFECT siempre produzca una recompensa visible con continuidad, no una bola que desaparece inmediatamente contra una pared.

## AURI — primer PJ de Aura Farm

El antiguo Operator Socket deja de ser una cara placeholder.

**AURI** es el primer lenguaje de personaje de la vertical slice:

- pequeña field-tech que vive dentro de la cabina central;
- casco/hood industrial;
- visor expresivo;
- pods laterales;
- núcleo luminoso en el traje;
- antena en forma de brote.

El brote es el primer puente visual entre **Aura**, la máquina y la idea de **Farm/cultivar** sin convertir el juego en estética agrícola literal.

### Posición

AURI vive en la cabina inferior central, entre los dos joysticks.

No se coloca dentro del centro jugable porque:

- taparía trayectorias;
- competiría con Tap/Slide/CHAIN;
- dificultaría el boss;
- convertiría al personaje en ruido visual.

La intención futura es tratar al PJ como **HUD diegético**: busto/cara/gestos desde la cabina mientras las garras siguen siendo sus herramientas.

AURI reacciona a:

- PERFECT;
- FLOW;
- CHAIN;
- MISS;
- Slide;
- Shield;
- boss;
- victoria.

## Dirección artística

La dirección se consolida como **bio-industrial music machine**:

- máquina arcade/sintetizador/reactor;
- chasis y actuadores físicos;
- energía de Aura;
- pequeños motivos de crecimiento/brote;
- color funcional según familia;
- personaje integrado en la máquina;
- información presentada como hardware del mismo universo.

El objetivo es abandonar progresivamente el aspecto de “UI de neón sobre fondo negro”.

## AURA MODULES

Las antiguas cartas se presentan ahora como **cartuchos/módulos insertables**.

Cada módulo incluye:

- código de serie `AF-XX`;
- familia funcional;
- ventana de simulación;
- nombre;
- efecto corto;
- descripción;
- posible sinergia;
- conectores físicos en la parte inferior.

### Previews

Las 13 mejoras tienen una mini-demostración animada de su comportamiento:

- Gemela — dos proyectiles.
- Rebote — bola rebotando entre paredes.
- Perfora — proyectil atravesando objetivos.
- Astillas — explosión que fragmenta.
- Bumper — rebote físico.
- Nova — expansión Power.
- Espejo — disparos simétricos.
- Relevo — nodos enlazados.
- Shock — onda AOE.
- Fusión — dos proyectiles que colisionan.
- Carga — impacto de pared y detonación.
- Duplicador — una bola se divide en dos.
- Shield — campo protector.

La build persistente, sus stacks y sinergias siguen visibles durante toda la run.

## Track 01 — GLASSHOUSE CIRCUIT

`src/music.js` contiene la primera composición original específica de Aura Farm.

### Estructura

- 110 BPM.
- 68 beats.
- 17 compases de 4/4.
- resolución interna de medio beat;
- sincronía obligatoria con el chart.

Secciones escritas:

**GERMINATE → SPROUT → CURRENT → RELAY → FRACTURE → OVERDRIVE → ASCENT → BLOOM → CORE**

### Seis stems

1. **DRUMS** — patrones de kick/snare/hat escritos por sección.
2. **BASS** — línea de bajo con patrones propios.
3. **HARMONY** — tríadas/pads que sostienen la progresión.
4. **LEAD** — frases melódicas escritas por sección.
5. **AURA** — capa aguda/reactiva ligada a build y CHAIN.
6. **BOSS** — ostinato grave activado en el acto final.

La música ya no es un groove genérico que se transpone por acto.

Cada acto reproduce la misma composición y modifica su **mezcla**:

- actos tempranos: drums/bass/harmony dominantes;
- actos avanzados: el lead se revela;
- builds de Slide elevan el lead;
- builds de explosión/fusión/pared elevan Aura;
- CHAIN aporta energía adicional;
- acto 7 activa el stem Boss;
- Phase 2 cambia el timbre del stem Boss.

Los clicks de build y SFX siguen siendo respuestas de gameplay por encima de los seis stems, no parte de la composición base.

## Sincronía música/chart

Al cargar la run se verifica que el chart tenga exactamente:

- 110 BPM;
- 68 beats.

Si la composición y el chart dejan de coincidir, la slice falla explícitamente en vez de tocar música desincronizada.

## Run / boss / CHAIN

Se mantienen los sistemas anteriores:

- 7 actos;
- densidad de chart creciente;
- grupos CHAIN legibles;
- AURA CORE con armadura orbitante;
- rebote del Core protegido;
- Phase 2;
- CORE BREAK;
- Daily;
- Practice;
- progresión FORGE / PRISM / PULSE;
- pausa/reanudación segura en móvil.

## Física

Regla no negociable:

**las notas y proyectiles se mueven a velocidad constante entre colisiones.**

La nueva Power Orb de Slide respeta esta regla: cambia dirección inicial y número de rebotes, no introduce aceleración.

## Qué validar ahora

1. ¿POWER RETURN hace que completar Slide se sienta realmente recompensado?
2. ¿AURI suma vínculo sin robar atención al gameplay?
3. ¿La cabina inferior es el lugar correcto para el PJ definitivo?
4. ¿Los AURA MODULES se entienden más rápido que las antiguas cartas?
5. ¿Puedes reconocer qué hace un módulo mirando sólo su preview?
6. ¿GLASSHOUSE CIRCUIT se siente como una canción y no como un metrónomo adornado?
7. ¿Notas cómo la build revela/modifica stems durante una run?
8. ¿TRACE o FOLLOW sigue siendo el candidato claro a sobrevivir?

## GitHub Pages

Fuente de verdad: `main`.

https://lootchen.github.io/Aura-Farm-/
