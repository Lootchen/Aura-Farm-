# Aura Farm — Mechanics Lab v0.23 Experimental

La v0.23 no intenta pulir el Slide anterior: **compara dos modelos de control distintos** para decidir cuál debe sobrevivir.

## Tecnología

- HTML + Canvas 2D
- JavaScript ES Modules
- Web Audio API como reloj maestro
- Pointer Events
- Charts JSON
- Mobile-first vertical

## Tap

Tap no cambia:

- dos pinzas;
- contacto físico = PERFECT;
- fallo físico = MISS;
- la bola golpeada pasa a ser un proyectil de velocidad constante;
- proyectiles pueden provocar CHAIN, colisiones, rebotes, explosiones y sinergias de upgrades.

## Slide experimental

Cada evento Slide declara ahora `mode: "trace"` o `mode: "follow"`.

### TRACE · DEDO

- El Slide se inicia tocando directamente el receptor sobre la cuerda.
- El dedo controla directamente la posición de la punta de la garra.
- Izquierda, derecha, arriba y abajo corresponden al movimiento real del dedo.
- Soltar rompe la conexión; es posible volver a capturar el receptor durante la pequeña gracia existente.
- El joystick de esa mano no se presenta como el control activo del Slide.

Objetivo de la prueba: comprobar si el gesto directo elimina toda transformación mental y hace que seguir frases curvas sea inmediato.

### FOLLOW · STICK

- El Slide se inicia desde la palanca correspondiente.
- El stick **ya no representa una orientación absoluta de la garra**.
- El stick funciona como velocidad 2D de un cursor/garra: empujar a la izquierda desplaza la punta hacia la izquierda; empujar arriba la desplaza arriba.
- La posición del jugador persiste al centrar el stick.
- El receptor musical continúa avanzando por la cuerda al ritmo del chart.

Objetivo de la prueba: conservar la fantasía de palanca/garra sin el problema anterior de convertir mentalmente stick → ángulo alrededor del pivote.

## Lab de comparación

`charts/tap-lab.json` contiene:

1. TRACE izquierdo de 6 beats;
2. FOLLOW derecho de 6 beats;
3. TRACE derecho de 6 beats;
4. FOLLOW izquierdo de 8 beats.

Los FOLLOW usan curvas deliberadamente suaves para medir el control antes de aumentar la dificultad. Los TRACE tienen cambios espaciales más expresivos.

El chart sólo admite `tap` y `slide`. Para Slide, `mode` es obligatorio y debe ser `trace` o `follow`.

## Upgrades

Las tres cartas aparecen ahora **centradas en pantalla**. Cada familia tiene un color consistente para acelerar la lectura:

- Slide — violeta.
- Disparo — azul/cyan.
- Colisión — rosa/rojo.
- Explosión — ámbar.
- Arena — turquesa.
- Chain — amarillo.
- Pared — azul.
- Defensa — gris.

El pool mantiene mejoras jugables visibles: Gemela, Rebote, Perfora, Astillas, Bumper, Nova, Espejo, Relevo, Shock, Fusión, Carga, Duplicador y Shield.

El selector intenta ofrecer familias diferentes en las tres opciones.

## Regla de física

Las bolas y proyectiles se mueven a velocidad constante entre colisiones. No se introduce gravedad, aceleración ni easing jugable.

## Qué hay que decidir probando v0.23

No buscamos todavía dificultad ni arte final. Hay que responder:

- ¿TRACE se entiende sin explicación?
- ¿FOLLOW hace que izquierda se sienta realmente izquierda?
- ¿Cuál produce más sensación musical?
- ¿Cuál combina mejor con la identidad de las garras?
- ¿Cuál querrías dominar durante una canción completa?

## Controles

- Tap: zonas táctiles izquierda/derecha.
- TRACE: dedo directamente sobre el receptor/riel.
- FOLLOW: palanca de la mano correspondiente.
- `H`: debug.
- `[` / `]`: offset de calibración.

## GitHub Pages

Fuente de verdad: `main`.

https://lootchen.github.io/Aura-Farm-/
