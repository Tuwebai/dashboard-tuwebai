# Desplegar Reglas de Firestore

Para solucionar los errores de permisos, necesitas desplegar las reglas de seguridad en tu proyecto Firebase.

## Pasos:

1. **Instalar Firebase CLI** (si no lo tienes):
   ```bash
   npm install -g firebase-tools
   ```

2. **Iniciar sesión en Firebase**:
   ```bash
   firebase login
   ```

3. **Inicializar Firebase en el proyecto**:
   ```bash
   firebase init firestore
   ```
   - Selecciona tu proyecto: `tuwebai-db`
   - Usa las reglas existentes: `firestore.rules`

4. **Desplegar las reglas**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Reglas implementadas:

- ✅ Usuarios autenticados pueden leer/escribir sus propios datos
- ✅ Usuarios pueden crear/leer/escribir sus propios proyectos
- ✅ Admin (`tuwebai@gmail.com`) tiene acceso completo
- ✅ Logs y tickets protegidos por usuario
- ✅ Pagos protegidos por cliente

## Verificar:

Después del despliegue, los errores de permisos deberían desaparecer y podrás:
- ✅ Crear proyectos sin errores
- ✅ Ver proyectos en tiempo real
- ✅ Login con Google funcionando
- ✅ Sin errores en la consola 