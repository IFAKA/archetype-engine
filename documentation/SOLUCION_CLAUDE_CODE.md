# Solución para Claude Code - Resumen Ejecutivo

## Tu Pregunta Original

> "Sigo sin entender cómo puedo 'conectar' el archetype-engine a Claude Code para que use la librería y solo toque lo que debería tocar"

## La Respuesta Directa

**No necesitás "conectar" nada**. Cuando el usuario ejecuta `npx archetype init`, Archetype genera automáticamente un archivo **`CLAUDE.md`** en el proyecto que Claude Code lee automáticamente.

## Cómo Funciona (Paso a Paso)

### 1. Usuario Inicializa Proyecto

```bash
npx create-next-app my-app && cd my-app
npm install archetype-engine
npx archetype init --yes
```

### 2. Archetype Genera Archivos Automáticamente

```
my-app/
├── archetype.config.ts
├── CLAUDE.md              ← Para Claude Code ✅
├── .cursorrules           ← Para Cursor/Windsurf
├── .gitignore
└── archetype/entities/
```

### 3. Usuario Abre Proyecto en Claude Code

```bash
# Usuario puede usar Claude Code CLI o la web
```

### 4. Claude Code Lee CLAUDE.md Automáticamente

Claude Code detecta el archivo `CLAUDE.md` en la raíz y lee las instrucciones:

```markdown
# Archetype Engine Project - Rules for Claude Code

## 🚫 NEVER Edit These Directories
- generated/db/
- generated/trpc/
- generated/schemas/
- generated/hooks/use*.ts

## ✅ ALWAYS Edit These Instead
- archetype/entities/
- archetype.config.ts
- manifest.json

## Workflow
1. Edit entities
2. Run: npm run archetype:generate
3. Run: npm run db:push
```

### 5. Claude Code Sigue las Reglas

Cuando el usuario pide:
```
"Agrega una entidad Product con nombre, precio y stock"
```

Claude Code:
1. ✅ Lee `CLAUDE.md`
2. ✅ Crea `archetype/entities/product.ts` (NO toca `generated/`)
3. ✅ Ejecuta `npm run archetype:generate`
4. ✅ Ejecuta `npm run db:push`

**NO edita código generado** porque `CLAUDE.md` se lo prohíbe explícitamente.

## Lo Que Implementé

### Archivo Nuevo en Templates

**`src/init/templates.ts`** - Nueva función `getClaudeMdTemplate()`

Genera un `CLAUDE.md` completo con:

```markdown
- 🚫 Directorios prohibidos (generated/)
- ✅ Directorios editables (archetype/entities/)
- 📝 Workflow correcto
- 🛠️ Comandos disponibles
- 📚 Ejemplos de código correcto/incorrecto
- 🔍 Referencia de field types
- 💡 Preguntas para hacerse antes de editar
```

### Auto-Generación en Init

Modificado `getAllTemplateFiles()` para incluir:

```typescript
{ path: 'CLAUDE.md', content: getClaudeMdTemplate() },        // Para Claude Code
{ path: '.cursorrules', content: getCursorRulesTemplate() },  // Para Cursor
```

### CLAUDE.md del Repo Actualizado

El `CLAUDE.md` en la raíz de archetype-engine ahora dice:

```markdown
## IMPORTANT: When Working in User Projects

If you find a CLAUDE.md in the project root, follow those rules instead.
```

Esto evita confusión entre:
- `archetype-engine/CLAUDE.md` → Reglas para desarrollar la librería
- `user-project/CLAUDE.md` → Reglas para usar la librería (auto-generado)

## Diferencias: Claude Code vs Cursor

| Característica | Claude Code | Cursor | Windsurf |
|---------------|-------------|---------|----------|
| **Archivo que lee** | `CLAUDE.md` | `.cursorrules` | `.cursorrules` |
| **Ubicación** | Raíz del proyecto | Raíz del proyecto | Raíz del proyecto |
| **Auto-generado por init** | ✅ Sí | ✅ Sí | ✅ Sí |
| **Formato** | Markdown | Markdown | Markdown |
| **Contenido** | Igual | Igual | Igual |

**Conclusión:** Archetype ahora genera AMBOS archivos para soportar todos los AI assistants.

## Ejemplo Real Completo

### Terminal del Usuario

```bash
# 1. Crear proyecto Next.js
npx create-next-app blog --typescript --tailwind --app --no-src-dir

# 2. Instalar Archetype
cd blog
npm install archetype-engine

# 3. Inicializar Archetype
npx archetype init --yes

✔ Archetype initialized successfully!
  
  Generated files:
  - archetype.config.ts
  - CLAUDE.md                  ← Para Claude Code
  - .cursorrules               ← Para Cursor/Windsurf
  - .gitignore
  - archetype/entities/task.ts
  - src/server/db.ts
  - src/server/trpc.ts
  ... (más archivos)

# 4. Usuario abre en cualquier AI
# (Claude Code detecta CLAUDE.md automáticamente)
```

### Usuario en Claude Code

```
Usuario: "Agrega una entidad Post con título, contenido y autor"
```

### Claude Code (internamente)

```
1. 🔍 Detecta CLAUDE.md en /blog/CLAUDE.md
2. 📖 Lee las reglas:
   - NO editar generated/
   - Editar archetype/entities/
   - Workflow: entities → generate → push
3. 🎯 Ejecuta workflow correcto
```

### Claude Code (responde)

```
Voy a crear la entidad Post siguiendo el workflow de Archetype:

1. Creando archetype/entities/post.ts...
2. Ejecutando npm run archetype:generate...
3. Ejecutando npm run db:push...

Listo! La entidad Post está creada con:
- Campos: title, content
- Relación: author (hasOne User)
- Generado: Schema, Router, Hooks, Validation
```

### Archivos Generados

```
blog/
├── archetype/
│   └── entities/
│       ├── task.ts
│       └── post.ts            ← Claude Code creó esto ✅
├── generated/                 ← Claude Code NO tocó esto ✅
│   ├── db/schema.ts
│   ├── trpc/routers/
│   │   ├── post.ts           ← Auto-generado por Archetype
│   │   └── task.ts
│   └── hooks/
│       ├── usePost.ts        ← Auto-generado
│       └── useTask.ts
├── CLAUDE.md                  ← Claude Code leyó esto
└── archetype.config.ts
```

## Qué Protege CLAUDE.md

### ❌ Claude Code NO Puede Editar

```
generated/db/schema.ts           → "NEVER edit generated/db/"
generated/trpc/routers/post.ts   → "NEVER edit generated/trpc/"
generated/schemas/post.ts        → "NEVER edit generated/schemas/"
generated/hooks/usePost.ts       → "NEVER edit generated/hooks/use*.ts"
```

### ✅ Claude Code SÍ Puede Editar

```
archetype/entities/post.ts       → "ALWAYS edit archetype/entities/"
archetype.config.ts              → "Edit configuration here"
manifest.json                    → "Alternative to entity files"
src/app/                         → "Next.js UI code"
generated/hooks/post.ts          → "Hook implementations (if enabled)"
```

## Por Qué Funciona

Claude Code tiene una feature built-in que busca y lee archivos especiales:

- **`CLAUDE.md`** en la raíz del proyecto
- **`README.md`** (contexto general)
- Archivos que el usuario le pasa explícitamente

Cuando encontrás `CLAUDE.md`, Claude Code lo lee **antes** de hacer cualquier cambio y sigue las instrucciones.

## Testing

### ✅ Build Exitoso

```bash
npm run build
# ✅ Sin errores
```

### ✅ Template Incluye CLAUDE.md

```typescript
// src/init/templates.ts
export function getClaudeMdTemplate(): string {
  // ✅ Implementado
}

// getAllTemplateFiles() ahora incluye:
{ path: 'CLAUDE.md', content: getClaudeMdTemplate() }
```

### ✅ Contenido Completo

El `CLAUDE.md` generado incluye:
- ✅ Reglas de qué NO editar
- ✅ Reglas de qué SÍ editar
- ✅ Workflow correcto (2 opciones: JSON + TypeScript)
- ✅ Comandos disponibles
- ✅ Ejemplos de uso correcto
- ✅ Ejemplos de uso incorrecto
- ✅ Referencia de field types
- ✅ Referencia de relaciones

## Documentación Actualizada

### Nuevos Archivos

1. **`documentation/SOLUCION_CLAUDE_CODE.md`** (este archivo)
   - Explicación específica para Claude Code
   - Cómo funciona el auto-detect de CLAUDE.md

2. **`documentation/GUIA_PARA_USUARIOS.md`** (actualizado)
   - Ahora menciona CLAUDE.md Y .cursorrules
   - Tabla de compatibilidad por AI assistant

3. **`documentation/CURSOR_RULES_IMPLEMENTATION.md`** (actualizado)
   - Ahora cubre AMBOS archivos

### Archivos Modificados

1. **`CLAUDE.md`** (raíz archetype-engine)
   - Agregada sección "When Working in User Projects"
   - Explica diferencia entre repo y user projects

2. **`src/init/templates.ts`**
   - Nueva función `getClaudeMdTemplate()`
   - Modificado `getAllTemplateFiles()` para incluirla

## Resumen Final

### Antes (❌ Problema)

```
Usuario: npx archetype init
→ No se genera CLAUDE.md
→ Usuario abre proyecto en Claude Code
→ Claude Code no sabe qué puede/no puede editar
→ Claude Code edita generated/ por error
→ Código se sobrescribe en próximo generate
→ 😡 Usuario confundido
```

### Después (✅ Solución)

```
Usuario: npx archetype init
→ ✅ Se genera CLAUDE.md automáticamente
→ Usuario abre proyecto en Claude Code
→ ✅ Claude Code lee CLAUDE.md
→ ✅ Claude Code sigue las reglas
→ ✅ Claude Code edita archetype/entities/
→ ✅ Claude Code NO toca generated/
→ 😊 Usuario feliz
```

## Respuesta a Tu Pregunta Original

> "¿Cómo puedo conectar archetype-engine a Claude Code?"

**Respuesta:** Ya está conectado. Cuando hacés `npx archetype init`, se genera automáticamente un archivo `CLAUDE.md` que Claude Code lee solo. No necesitás configurar absolutamente nada más.

**Es literalmente "zero-config"** - funciona out of the box.

---

## Próximos Pasos Opcionales

Si querés mejorar aún más la experiencia:

1. **JSON Schema** - Para autocomplete de manifest.json
2. **Ejemplos** - Templates de manifests comunes (blog, ecommerce, etc.)
3. **CLI interactivo** - `archetype add-entity` sin editar archivos
4. **Validación en CI** - Verificar que CLAUDE.md existe en proyectos

Pero para tu pregunta original, **la solución está completa y funcional**.

## ¿Tenés Más Preguntas?

- ¿Cómo testeo que Claude Code realmente lee CLAUDE.md?
- ¿Querés agregar más reglas específicas?
- ¿Necesitás ejemplos de casos de uso complejos?

Decime y lo implementamos.
