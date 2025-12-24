# Implementación de `.cursorrules` para Archetype

## Problema Resuelto

**Pregunta original:** "¿Cómo puedo 'conectar' archetype-engine a Claude Code para que use la librería y solo toque lo que debería tocar?"

**Problema:** Los AI assistants (Claude Code, Cursor, Windsurf) tienen acceso total al filesystem. Sin instrucciones, pueden editar código generado que se sobrescribirá.

## Solución Implementada

### 1. Archivo `.cursorrules` Auto-Generado

**Qué hace:**
- Se genera automáticamente cuando el usuario ejecuta `npx archetype init`
- Instruye al AI sobre qué puede y no puede editar
- Define el workflow correcto de Archetype
- Incluye ejemplos de uso correcto e incorrecto

**Archivos modificados:**
- `src/init/templates.ts` - Nueva función `getCursorRulesTemplate()`
- `src/init/templates.ts` - Agregado a `getAllTemplateFiles()` para auto-generar

### 2. Documentación en Español

**Archivo:** `documentation/GUIA_PARA_USUARIOS.md`

Explica:
- Cómo funciona la integración con AI assistants
- Por qué NO necesitas "conectar" nada
- Workflow recomendado (JSON vs TypeScript)
- Qué protege `.cursorrules`
- Comparación de métodos (cursorrules, MCP, API)

### 3. Actualización de CLAUDE.md

**Archivo:** `CLAUDE.md`

Agregado al inicio:
```markdown
## IMPORTANT: When Working in User Projects

If you are in a user's project (NOT the archetype-engine repo itself), 
this project should have a `.cursorrules` file with specific rules.

**ALWAYS read `.cursorrules` first** before making any changes.
```

### 4. `.cursorrules` en archetype-engine repo

**Archivo:** `.cursorrules` (raíz del repo)

Template de referencia para:
- Desarrolladores que contribuyen al proyecto
- Usuarios que quieren personalizar sus reglas
- Documentación de ejemplo

## Cómo Funciona

### Para el Usuario

```bash
# 1. Instalar
npm install archetype-engine

# 2. Inicializar (genera .cursorrules automáticamente)
npx archetype init

# 3. Abrir en AI IDE
cursor .

# 4. El AI lee .cursorrules automáticamente
# Ya sabe qué hacer ✨
```

### Para el AI Assistant

1. **Lee `.cursorrules`** al abrir el proyecto
2. **Sigue las reglas**:
   - ❌ NO edita `generated/`
   - ✅ Edita `archetype/entities/`
   - ✅ Ejecuta `npm run archetype:generate` después de cambios
3. **Usa el workflow correcto**:
   - Entities → Generate → Push to DB

## Reglas Incluidas en `.cursorrules`

### 🚫 Prohibiciones
- NUNCA editar `generated/db/`
- NUNCA editar `generated/trpc/`
- NUNCA editar `generated/schemas/`
- NUNCA editar `generated/hooks/use*.ts`

### ✅ Permisos
- Editar `archetype/entities/`
- Editar `archetype.config.ts`
- Editar `src/app/`, `src/components/`
- Editar `generated/hooks/{entity}.ts` (implementaciones de hooks)

### 📝 Workflows

**Workflow 1: JSON Manifest (Recomendado)**
```bash
# Crear manifest.json
# Ejecutar: npx archetype generate manifest.json
# Ejecutar: npx drizzle-kit push
```

**Workflow 2: TypeScript Files**
```bash
# Editar archetype/entities/user.ts
# Ejecutar: npm run archetype:generate
# Ejecutar: npm run db:push
```

### 📚 Ejemplos

Incluye ejemplos de:
- ❌ Lo que NO hacer (editar generated/)
- ✅ Lo que SÍ hacer (editar entities, usar hooks)
- 🛠️ Comandos disponibles

## Compatibilidad

| AI Assistant | Soporte | Automático |
|-------------|---------|------------|
| **Cursor** | ✅ Oficial | Sí |
| **Windsurf** | ✅ Oficial | Sí |
| **Claude Code** | ✅ Lee CLAUDE.md | Sí |
| **Copilot** | ⚠️ Parcial | No (usa comentarios) |
| **v0.dev** | ❌ N/A | N/A (sin filesystem) |

## Beneficios

### Para Usuarios
- ✅ **Zero config** - funciona automáticamente después de `init`
- ✅ **Protección** - el AI no toca código generado
- ✅ **Educativo** - el usuario aprende el workflow correcto
- ✅ **Consistente** - todos los AI siguen las mismas reglas

### Para Desarrolladores
- ✅ **Menos soporte** - usuarios no rompen sus proyectos
- ✅ **Mejor experiencia** - el AI hace lo correcto
- ✅ **Escalable** - funciona con cualquier AI que lea `.cursorrules`

## Testing

### Cómo verificar que funciona

1. **Crear proyecto de prueba:**
```bash
mkdir test-archetype-cursorrules
cd test-archetype-cursorrules
npm init -y
npm install archetype-engine
npx archetype init --yes
```

2. **Verificar que `.cursorrules` existe:**
```bash
cat .cursorrules
# Debe mostrar las reglas completas
```

3. **Abrir en Cursor/Claude Code:**
```bash
cursor .
```

4. **Pedirle al AI:**
- "Agrega una entidad Product con nombre y precio"
- Verificar que:
  - ✅ Crea `archetype/entities/product.ts`
  - ✅ NO toca `generated/`
  - ✅ Ejecuta `npm run archetype:generate`

### Test Manual Realizado

- ✅ Build exitoso (`npm run build`)
- ✅ Template genera `.cursorrules` correctamente
- ✅ Contenido del archivo es correcto
- ✅ Documentación en español completa
- ✅ CLAUDE.md actualizado

## Próximos Pasos (Opcional)

### Mejoras Futuras

1. **JSON Schema para manifest.json**
   - Autocomplete en IDE
   - Validación en tiempo real
   - Mejores mensajes de error

2. **Ejemplos de manifests**
   - `examples/blog-manifest.json`
   - `examples/ecommerce-manifest.json`
   - `examples/saas-manifest.json`

3. **Comandos AI-friendly**
   - `archetype add-entity User` (CLI interactivo)
   - `archetype add-field User email text` (sin editar archivos)

4. **Validación en CI**
   - GitHub Action que valida `.cursorrules` existe
   - Tests que verifican generación correcta

## Archivos Modificados/Creados

### Nuevos
- `.cursorrules` (raíz)
- `documentation/GUIA_PARA_USUARIOS.md`
- `documentation/CURSOR_RULES_IMPLEMENTATION.md` (este archivo)

### Modificados
- `src/init/templates.ts` - Agregado `getCursorRulesTemplate()`
- `CLAUDE.md` - Sección sobre `.cursorrules` en user projects

### Sin cambios
- `src/cli.ts` - No requiere cambios
- `package.json` - No requiere cambios
- Tests - Siguen pasando

## Resumen

**Antes:**
- Usuario corre `npx archetype init`
- Abre proyecto en AI IDE
- AI no sabe qué puede editar
- Usuario tiene que corregir manualmente

**Después:**
- Usuario corre `npx archetype init`
- Se genera `.cursorrules` automáticamente
- Abre proyecto en AI IDE
- **AI lee reglas y hace todo correcto** ✨

**Resultado:** Zero-config AI protection para proyectos Archetype.

## Referencias

- **Cursor Rules:** https://docs.cursor.com/context/rules-for-ai
- **Windsurf Rules:** Soporta `.cursorrules` desde v1.0
- **Claude.md Convention:** https://modelcontextprotocol.io/docs/concepts/resources

## Contribuciones

Si encuentras casos donde el AI NO respeta `.cursorrules`:
1. Reporta el issue en el repo
2. Incluye:
   - Qué AI assistant usas
   - Qué regla ignoró
   - Logs del comportamiento

Esto nos ayuda a mejorar las reglas para todos.
