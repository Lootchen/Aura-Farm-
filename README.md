# Aura Farm — Mechanics Lab v0.21

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
- No hay GOOD/GREAT ocultos: si la pinza toca físicamente la bola, es **PERFECT**; si no, MISS.
- La bola golpeada pasa a ser un proyectil a velocidad constante.
- Los proyectiles pueden colisionar con notas entrantes, paredes, otros proyectiles y bumpers.
- Las colisiones pueden producir CHAIN y explosiones.

### Slide

- Cada control es un joystick 2D real con base, vástago y cap móvil.
- El joystick vuelve al centro al soltarlo.
- La pinza copia dirección y alcance del stick.
- El objetivo se presenta como un **riel físico** en el campo de juego, no como información dentro del joystick.
- El éxito se calcula por distancia real en píxeles entre la punta de la pinza y el gate del riel.
- La anchura visible del riel corresponde a la tolerancia jugable.
- Completar el Slide dispara una Power Orb; mejoras como Nova pueden multiplicarla.

### Magic

Magic está pausado y ya no forma parte del contrato de charts de v0.21.

## Upgrades

Al final de cada oleada aparecen tres cartas compactas. Las mejoras deben cambiar algo visible de la partida, no porcentajes ocultos.

Pool v0.21:

- **Gemela** — añade un proyectil al disparo.
- **Rebote** — añade rebotes de pared conservando velocidad constante.
- **Perfora** — permite atravesar notas entrantes.
- **Astillas** — las explosiones generan proyectiles pequeños.
- **Bumper** — añade un reflector físico al tablero.
- **Nova** — añade dos Power Orbs al completar un Slide.
- **Shield** — salva un combo roto una vez.

## Chart de laboratorio

`charts/tap-lab.json` prueba cuatro familias de Slide:

1. barrido direccional;
2. arco suave;
3. cambio brusco;
4. variación de alcance.

Los anchors usan `beat / x / y` y deben permanecer dentro del círculo unitario del joystick.

## Controles

- Móvil: zonas táctiles izquierda/derecha.
- Teclado: `A` / flecha izquierda y `D` / flecha derecha para Tap.
- `H`: debug oculto.
- `[` / `]`: offset de calibración.

## Filosofía

1. Lo que se ve debe coincidir con lo que se juzga.
2. Movimiento gameplay siempre a velocidad constante.
3. Tap = golpear físicamente.
4. Slide = apuntar físicamente.
5. Upgrades = alterar físicamente lo que ocurre después.
6. Visuales secundarios a feeling, lectura y mecánicas.

## GitHub Pages

La fuente de verdad es la rama `main`.

Prueba directa:

https://lootchen.github.io/Aura-Farm-/
