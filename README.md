# Aura Farm — Mechanics Lab

Reinicio del proyecto enfocado primero en **mecánicas, timing y sensación de juego**. El apartado visual queda deliberadamente en segundo plano hasta que el gameplay esté pulido.

## Tecnología

- HTML
- CSS
- JavaScript ES Modules
- Canvas 2D
- Web Audio API
- Pointer Events
- Sin frameworks ni dependencias externas por ahora

## Build actual

Primera prueba de **Tap**:

- reloj musical a 120 BPM;
- count-in de 4 beats;
- botones izquierda/derecha;
- notas deterministas sincronizadas con Web Audio;
- ventanas iniciales:
  - Perfect: ±70 ms
  - Great: ±140 ms
  - Good: ±220 ms
- score y combo;
- medición del error real del input en milisegundos;
- física visual sólo después de acertar la nota;
- modo debug visible en pantalla.

Los valores son provisionales y existen precisamente para poder probarlos y ajustarlos.

## Probar directamente en navegador con GitHub Pages

El repositorio es público, así que la configuración más simple es GitHub Pages desde la rama `main`.

Configuración única en GitHub:

1. `Settings`
2. `Pages`
3. En `Build and deployment`, elegir `Deploy from a branch`
4. Branch: `main`
5. Folder: `/ (root)`
6. `Save`

Después de eso, cada push a `main` se publica automáticamente y basta con recargar la misma URL de Pages para probar la última versión.

URL esperada:

`https://lootchen.github.io/Aura-Farm-/`

## Controles

- Móvil: botones `IZQ` y `DER`.
- Teclado: `A` / flecha izquierda y `L` / flecha derecha.

## Filosofía de desarrollo

1. Timing y respuesta del input.
2. Tap.
3. Magic.
4. Slide.
5. Combinaciones y dificultad.
6. Sólo después, dirección visual y arte final.
