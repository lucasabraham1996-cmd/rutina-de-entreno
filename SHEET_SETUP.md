# Conectar la app con Google Sheet

La hoja ya fue creada: **Rutina de Entreno - Datos**.

## Una sola vez
1. Abrí la Google Sheet.
2. Extensiones → Apps Script.
3. Borrá el contenido de `Code.gs` y pegá el archivo `Code.gs` de este repositorio.
4. Implementar → Nueva implementación → tipo **Aplicación web**.
5. Ejecutar como: **Yo**.
6. Quién tiene acceso: **Cualquier persona**.
7. Implementar y autorizar.
8. Copiá la URL que termina en `/exec`.
9. En la app: Progreso → Google Sheet → pegá la URL → **Guardar conexión** → **Probar**.

Desde ese momento la app guarda primero en el teléfono y envía a la Sheet sesiones, progreso, personalizaciones y cambios de ejercicios completados. Si estás sin conexión, los eventos quedan en cola y se reintentan después.
