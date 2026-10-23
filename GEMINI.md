# Reglas y Preferencias del Proyecto (Imperia Uniformes - Capturista IA)

## 🚨 REGLA OBLIGATORIA: DESPLIEGUE CONTINUO (GIT PUSH AL FINAL)
- **SIEMPRE que se termine de generar cualquier cambio, modificación de código, corrección de errores o actualización de componentes, es ESTRICTAMENTE OBLIGATORIO realizar `git push origin master` al final del turno.**
- **Motivo:** El usuario prueba y valida la aplicación directamente en su despliegue activo en **Vercel** ([https://imperia-capturista.vercel.app](https://imperia-capturista.vercel.app)), el cual se actualiza y sincroniza desde el repositorio en GitHub ([https://github.com/ArquitectoManchego/imperia-capturista](https://github.com/ArquitectoManchego/imperia-capturista)).
- **Flujo de Cierre Obligatorio:**
  1. Validar compilación exitosa (`pnpm build`).
  2. Ejecutar `git add .` (respetando `.gitignore` para no exponer secretos en commits).
  3. Ejecutar `git commit -m "<tipo>(<alcance>): <descripción clara del cambio>"`.
  4. Ejecutar `git push origin master`.
  5. Sincronizar o verificar en Vercel Production (`pnpm dlx vercel --prod --yes`).
  6. Confirmar explícitamente en la respuesta final que el `git push` fue ejecutado y que el repositorio y la página de Vercel están actualizados.

---

## ⚙️ Reglas de Dominio y Negocio de Imperia Uniformes
- **Enfoque 100% WebApp:** La aplicación es exclusivamente una WebApp responsiva para PC y navegadores de Celular. No generar código ni botones para instalación de `.apk`.
- **Motor de Análisis Predeterminado:** Sistema Superior (`Multi-Pass Adversarial Chain-of-Verification CoVe`) con `gemini-2.5-flash` y Árbitro Adversarial con léxico de Imperia Uniformes y cuadre contable.
- **Protección de Cuota:** Respetar el tope de 500 hojas/hora de créditos en todo momento.
- **Base de Datos:** Software Imperia Firestore (`html-dashboard-integrator`, colecciones `pedidos` y `clientes`).
