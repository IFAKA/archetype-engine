# Guía para Usuarios de Archetype Engine

## ¿Cómo funciona la integración con AI Assistants?

Cuando usas **Claude Code**, **Cursor**, **Windsurf** u otro AI assistant en tu proyecto, el AI tiene acceso completo al filesystem. Esto significa que **puede modificar cualquier archivo** - incluso el código generado que NO debería tocar.

### El Problema

Sin instrucciones claras, un AI assistant podría:

❌ Editar directamente `generated/trpc/routers/user.ts` (se va a sobrescribir)
❌ Modificar `generated/db/schema.ts` (código generado)
❌ Crear archivos innecesarios
❌ No seguir el workflow correcto de Archetype

### La Solución: Archivos de Reglas para AI

Archetype **genera automáticamente** archivos de reglas cuando ejecutas `npx archetype init`:

- **`CLAUDE.md`** - Para Claude Code (claude.ai/code)
- **`.cursorrules`** - Para Cursor y Windsurf

Estos archivos le dicen al AI:
- ✅ QUÉ puede editar (entidades, config, UI)
- ❌ QUÉ NO puede editar (código generado)
- 📝 Cuál es el workflow correcto
- 🛠️ Qué comandos usar

## ¿Cómo se "conecta" Archetype con Claude Code?

**No necesitas "conectar" nada** - funciona automáticamente:

1. **Creas tu proyecto**: `npx archetype init`
2. **Se generan archivos de reglas**:
   - `CLAUDE.md` (para Claude Code)
   - `.cursorrules` (para Cursor/Windsurf)
3. **Abres el proyecto en tu AI favorito**: 
   - Claude Code lee `CLAUDE.md`
   - Cursor/Windsurf leen `.cursorrules`
4. **El AI sabe qué hacer**: Sigue las reglas automáticamente

### Ejemplo Real

```bash
# 1. Usuario crea proyecto
npx create-next-app my-app && cd my-app
npm install archetype-engine
npx archetype init --yes

# 2. Se crean automáticamente archivos de reglas
# - CLAUDE.md (para Claude Code)
# - .cursorrules (para Cursor/Windsurf)

# 3. Usuario abre en Cursor/Claude Code
cursor .

# 4. Usuario pide al AI:
# "Agrega una entidad User con email y password"

# 5. El AI lee .cursorrules y hace lo correcto:
# - Crea archetype/entities/user.ts ✅
# - NO edita generated/ ✅
# - Ejecuta npm run archetype:generate ✅
# - Ejecuta npm run db:push ✅
```

## Flujo de Trabajo Recomendado

### Para Aplicaciones Nuevas (Recomendado)

Usa **JSON manifest** - más rápido para AI:

```bash
# 1. El AI crea manifest.json
{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "required": true },
        "name": { "type": "text", "required": true }
      }
    }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}

# 2. El AI ejecuta
npx archetype generate manifest.json

# 3. El AI ejecuta
npx drizzle-kit push
```

**Ventajas:**
- 1 archivo en lugar de 5+
- JSON simple en lugar de TypeScript complejo
- 2 comandos en lugar de 6+ pasos

### Para Cambios Incrementales

Usa **archivos TypeScript**:

```typescript
// El AI edita: archetype/entities/user.ts
import { defineEntity, text } from 'archetype-engine'

export const User = defineEntity('User', {
  fields: {
    email: text().required().unique().email(),
    // El AI agrega campo nuevo
    phone: text().optional(),
  },
})
```

```bash
# El AI ejecuta
npm run archetype:generate
npm run db:push
```

## Qué Protege `.cursorrules`

### ✅ Permite Editar (Source)

```
archetype/entities/          → Definiciones de entidades
archetype.config.ts          → Configuración
src/app/                     → Páginas Next.js
src/components/              → Componentes React
generated/hooks/{entity}.ts  → Implementación de hooks (lógica custom)
```

### ❌ Prohíbe Editar (Generated)

```
generated/db/                → Schemas de Drizzle
generated/trpc/              → Routers de tRPC
generated/schemas/           → Schemas de Zod
generated/hooks/use*.ts      → React hooks
generated/erd.md             → Diagrama ERD
```

## Reglas para el AI

El `.cursorrules` incluye:

### 1. Reglas Críticas
- NUNCA editar código generado
- Siempre editar entidades en lugar de schemas

### 2. Workflow Correcto
- Editar entidades → Generar → Push a DB

### 3. Ejemplos Prácticos
- ✅ Cómo agregar campos correctamente
- ❌ Qué NO hacer (editar generated/)

### 4. Comandos Disponibles
```bash
npm run archetype:generate   # Generar código
npm run archetype:view       # Ver ERD
npm run db:push              # Push a DB
npm run db:studio            # Drizzle Studio
```

## AI Assistants Soportados

Archetype genera automáticamente reglas para diferentes AI assistants:

| AI Assistant | Archivo que Lee | Auto-Generado | Soporte |
|--------------|----------------|---------------|---------|
| **Claude Code** | `CLAUDE.md` | ✅ Sí | ✅ Completo |
| **Cursor** | `.cursorrules` | ✅ Sí | ✅ Completo |
| **Windsurf** | `.cursorrules` | ✅ Sí | ✅ Completo |
| **GitHub Copilot** | Comentarios en código | ❌ No | ⚠️ Parcial |
| **v0.dev / Bolt.new** | N/A (sin filesystem) | ❌ No | ❌ N/A |

### Claude Code (claude.ai/code)

**Archivo:** `CLAUDE.md` (generado automáticamente)

Incluye:
- ✅ Qué archivos NO editar (`generated/`)
- ✅ Workflow correcto (entities → generate → push)
- ✅ Comandos disponibles
- ✅ Ejemplos de uso correcto/incorrecto
- ✅ Referencia de field types y relaciones

### Cursor y Windsurf

**Archivo:** `.cursorrules` (generado automáticamente)

Mismo contenido que `CLAUDE.md` pero en formato optimizado para estas IDEs.

## Preguntas Frecuentes

### ¿Necesito instalar algo especial?

No. Solo necesitas:
1. Instalar `archetype-engine`
2. Correr `npx archetype init`
3. Usar tu AI assistant favorito

### ¿Funciona con otros IDEs?

Sí. El archivo `.cursorrules` es un estándar informal que muchos AI assistants respetan:
- Cursor (oficial)
- Windsurf (oficial)
- Otros IDEs con AI pueden agregar soporte

### ¿Qué pasa si el AI ignora las reglas?

Si el AI intenta editar `generated/`:
1. El código se va a sobrescribir en el próximo `generate`
2. Puedes recordarle: "Lee .cursorrules - no edites generated/"
3. Reporta el problema al AI assistant

### ¿Puedo personalizar `.cursorrules`?

¡Sí! Después de `archetype init`, puedes editar `.cursorrules` para:
- Agregar reglas específicas de tu proyecto
- Cambiar el workflow
- Agregar comandos custom

### ¿Cómo sé si el AI está siguiendo las reglas?

Verifica que:
- ✅ Solo edita `archetype/entities/`
- ✅ Ejecuta `npm run archetype:generate` después de cambios
- ✅ NO toca `generated/` directamente

## MCP Server (Opcional - Avanzado)

Para AI assistants que soportan MCP (Model Context Protocol), Archetype también ofrece un **MCP Server**:

```json
// ~/.config/claude/config.json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["archetype-engine", "mcp"]
    }
  }
}
```

**Ventajas:**
- Llamadas directas a funciones (sin CLI)
- Más rápido (sin overhead de procesos)
- Validación en tiempo real

**Cuándo usar:**
- Si tu AI soporta MCP (Claude Desktop, algunos bots)
- Para workflows avanzados
- Para proyectos grandes

**Documentación completa:** Ver `MCP_SERVER.md`

## Resumen

| Método | Uso | Velocidad | Setup |
|--------|-----|-----------|-------|
| **`CLAUDE.md` / `.cursorrules`** | Claude Code, Cursor, Windsurf | Automático | ✅ Incluido en `init` |
| **MCP Server** | Claude Desktop, MCP clients | Más rápido | ⚙️ Config manual |
| **API Module** | Apps custom, web builders | Programático | 💻 Código custom |

### Recomendación por AI Assistant

| Si usas... | Entonces... | Archivo que lee |
|-----------|-------------|-----------------|
| **Claude Code** | ✅ `npx archetype init` (ya está!) | `CLAUDE.md` |
| **Cursor** | ✅ `npx archetype init` (ya está!) | `.cursorrules` |
| **Windsurf** | ✅ `npx archetype init` (ya está!) | `.cursorrules` |
| **Claude Desktop** | ⚙️ Configura MCP Server (opcional) | MCP protocol |

Para la mayoría de usuarios:
1. Simplemente haz **`npx archetype init`**
2. Abre tu proyecto en tu **AI favorito**
3. El AI lee automáticamente el archivo correcto
4. Deja que el AI haga su magia siguiendo las reglas ✨

**No necesitas configurar nada más** - funciona out of the box.

## Próximos Pasos

1. **Instala Archetype**: `npm install archetype-engine`
2. **Inicializa tu proyecto**: `npx archetype init`
3. **Abre en tu AI IDE favorito**: `cursor .` o `code .`
4. **Pide al AI crear entidades**: "Crea una entidad Product con nombre, precio y stock"
5. **El AI sigue `.cursorrules` automáticamente** ✨

¿Preguntas? Abre un issue: https://github.com/sst/archetype-engine/issues
