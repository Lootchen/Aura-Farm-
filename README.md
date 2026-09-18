# Aura Farm — Mechanics Lab v0.22

Prototipo vertical mobile-first centrado en **timing, contacto físico, apuntado y reacciones en cadena**.

## Tecnología

- HTML + Canvas 2D
- JavaScript ES Modules
- Web Audio API como reloj maestro
- Pointer Events
- Charts JSON
- Sin frameworks ni dependencias externas

## Núcleo jugable

### Tap

- Dos pinzas: izquierda y derecha.
- Si la pinza toca físicamente la bola, es **PERFECT**; si no, MISS.
- La bola golpeada se convierte en proyectil a velocidad constante.
- Proyectiles chocan con notas entrantes, paredes, otros proyectiles y bumpers.
- Esas colisiones pueden producir CHAIN y nuevas reacciones.

### Slide — v0.22

El Slide mantiene el joystick 2D real, pero su lectura se rediseñó como una frase instrumental:

- cuerda luminosa continua;
- gemas rítmicas sobre la cuerda;
- anchors importantes como gemas mayores;
- marcas de dirección;
- receptor móvil sobre el punto exacto que hay que seguir;
- corredor visual cuya anchura coincide con la tolerancia jugable;
- rastro dorado cuando la pinza permanece conectada;
- frase larga de 8 beats en el chart de laboratorio.

La referencia conceptual es el lenguaje de slider/sustain de juegos de guitarra: una serie de notas conectadas por una trayectoria visible. Aura Farm lo traduce a movimiento 2D libre de una garra.

El juicio sigue siendo físico: distancia en píxeles entre la punta de la garra y el receptor del riel.

### Magic

Magic continúa pausado y fuera del contrato de charts.

## Upgrades v0.22

Las cartas siguen en una fila horizontal de tres, pero ahora incluyen una descripción muy breve y las opciones intentan pertenecer a familias distintas.

Pool actual:

- **Gemela** — cada PERFECT dispara una bola extra.
- **Rebote** — los proyectiles sobreviven a otra pared.
- **Perfora** — atraviesa una nota y sigue volando.
- **Astillas** — las explosiones generan nuevos proyectiles.
- **Bumper** — añade un reflector físico al tablero.
- **Nova** — un Slide termina en una salva mayor.
- **Espejo** — el Slide también dispara desde la otra garra.
- **Relevo** — un CHAIN continúa con un nuevo proyectil.
- **Shock** — una explosión Power barre notas cercanas.
- **Fusión** — el choque entre proyectiles detona como Power.
- **Carga** — los impactos de pared detonan como Power.
- **Duplicador** — el primer rebote en bumper duplica la bola.
- **Shield** — el próximo MISS no rompe el combo.

Las mejoras siguen evitando aceleración o gravedad: las bolas se mueven siempre con velocidad constante entre colisiones.

## Chart de laboratorio

`charts/tap-lab.json` incluye cinco familias de prueba:

1. barrido direccional;
2. arco suave;
3. cambio brusco;
4. variación de alcance;
5. frase larga de slider de 8 beats.

Los anchors usan `beat / x / y` y permanecen dentro del círculo unitario del joystick.

## Controles

- Móvil: zonas táctiles izquierda/derecha.
- Teclado: `A` / flecha izquierda y `D` / flecha derecha para Tap.
- `H`: debug oculto.
- `[` / `]`: offset de calibración.

## Filosofía

1. Lo que se ve debe coincidir con lo que se juzga.
2. Movimiento gameplay siempre a velocidad constante.
3. Tap = golpear físicamente.
4. Slide = apuntar y recorrer físicamente una frase.
5. Upgrades = cambiar reglas visibles del tablero.
6. Visuales secundarios a feeling, lectura y mecánicas.

## GitHub Pages

Fuente de verdad: `main`.

https://lootchen.github.io/Aura-Farm-/
