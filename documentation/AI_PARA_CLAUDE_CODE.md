# Cómo Archetype Funciona con AI (Claude Code, Cursor, etc.)

## Resumen Simple

Archetype tiene **DOS formas** de trabajar con AI:

### 1. **API Approach** (Para Apps Web)
```typescript
// Tu app llama a OpenAI/Anthropic
const builder = createManifestBuilder()
await generateText({
  model: openai('gpt-4'),
  tools: aiTools.vercel(builder),
  prompt: "Crea un blog"
})
```
- ✅ Bueno para: Apps web que generan backends bajo demanda
- ❌ Lento: 10+ llamadas a API, $0.50 por generación
- ❌ Requiere: API keys, billing

### 2. **MCP Approach** (Para Editores/IDEs)
```bash
# Claude Code ejecuta directamente:
npx archetype generate manifest.json
```
- ✅ **10x más rápido**: Sin API round-trips
- ✅ **GRATIS**: No cuesta dinero
- ✅ **Simple**: Una línea de configuración

## ¿Qué es MCP?

**Model Context Protocol** = Protocolo que permite a AI (Claude, GPT) llamar funciones locales directamente.

```
┌──────────────┐
│ Claude Code  │  ← El AI que estás usando ahora
└──────┬───────┘
       │
       │ MCP = llamada directa (no API)
       │
┌──────▼────────┐
│  Archetype    │  ← Genera código localmente
│  MCP Server   │
└──────┬────────┘
       │
       │ Escribe archivos
       │
┌──────▼────────┐
│  generated/   │  ← Tu backend listo
└───────────────┘
```

## Configuración Para Claude Code / Cursor

### Opción 1: Workflow JSON (Recomendado)

Ya está configurado en `CLAUDE.md`. Cuando el usuario dice:

> "Crea un blog con usuarios y posts"

**Claude Code hace:**

1. **Crea `manifest.json`:**
```json
{
  "entities": [
    {
      "name": "User",
      "fields": {
        "email": { "type": "text", "email": true, "unique": true },
        "name": { "type": "text", "required": true }
      }
    },
    {
      "name": "Post",
      "fields": {
        "title": { "type": "text", "min": 1, "max": 200 },
        "content": { "type": "text", "required": true }
      },
      "relations": {
        "author": { "type": "hasOne", "entity": "User" }
      },
      "protected": "write"
    }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
```

2. **Ejecuta:**
```bash
npx archetype validate manifest.json --json
npx archetype generate manifest.json
```

3. **Listo** - 400+ líneas de código en 2 comandos

### Opción 2: MCP Server (Próximamente)

Para Claude Desktop (no Claude Code aún):

```json
// ~/.config/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["archetype-engine", "mcp"]
    }
  }
}
```

Claude Desktop podrá llamar tools como:
- `archetype_create_manifest`
- `archetype_generate`
- `archetype_validate_manifest`

## Comparación de Enfoques

### ❌ Enfoque Ineficiente (TypeScript files)

```typescript
// Claude Code escribe 5 archivos:

// archetype.config.ts
export default defineConfig({
  entities: [User, Post],
  database: { type: 'sqlite', file: './app.db' }
})

// archetype/entities/user.ts
export const User = defineEntity('User', {
  fields: {
    email: text().required().email().unique(),
    name: text().required()
  }
})

// archetype/entities/post.ts
export const Post = defineEntity('Post', {
  fields: {
    title: text().required().min(1).max(200),
    content: text().required()
  },
  relations: {
    author: hasOne('User')
  }
})

// Luego ejecuta:
npx archetype generate
```

**Problemas:**
- 5 archivos para crear
- Sintaxis TypeScript compleja
- Más tokens usados
- Más tiempo

### ✅ Enfoque Eficiente (JSON manifest)

```bash
# Claude Code crea 1 archivo:
cat > manifest.json << 'EOF'
{
  "entities": [
    { "name": "User", "fields": {...} },
    { "name": "Post", "fields": {...}, "relations": {...} }
  ],
  "database": { "type": "sqlite", "file": "./app.db" }
}
EOF

# Genera todo:
npx archetype generate manifest.json
```

**Ventajas:**
- 1 archivo
- Sintaxis JSON simple
- Menos tokens
- **10x más rápido**

## Ejemplo Completo: E-commerce

### Usuario dice:
> "Crea un e-commerce con productos, órdenes, y clientes"

### Claude Code ejecuta:

```bash
# 1. Crear manifest con todas las entidades
cat > manifest.json << 'EOF'
{
  "entities": [
    {
      "name": "Product",
      "fields": {
        "name": { "type": "text", "required": true, "min": 1, "max": 200 },
        "description": { "type": "text" },
        "price": { "type": "number", "required": true, "positive": true },
        "stock": { "type": "number", "integer": true, "min": 0, "default": 0 }
      },
      "behaviors": { "timestamps": true }
    },
    {
      "name": "Customer",
      "fields": {
        "email": { "type": "text", "email": true, "unique": true },
        "name": { "type": "text", "required": true },
        "phone": { "type": "text" }
      },
      "behaviors": { "timestamps": true },
      "protected": "all"
    },
    {
      "name": "Order",
      "fields": {
        "orderNumber": { "type": "text", "required": true, "unique": true },
        "status": { "type": "text", "oneOf": ["pending", "paid", "shipped", "delivered"], "default": "pending" },
        "total": { "type": "number", "required": true, "positive": true }
      },
      "relations": {
        "customer": { "type": "hasOne", "entity": "Customer" },
        "products": { 
          "type": "belongsToMany", 
          "entity": "Product",
          "through": {
            "fields": {
              "quantity": { "type": "number", "required": true, "min": 1 },
              "unitPrice": { "type": "number", "required": true }
            }
          }
        }
      },
      "behaviors": { "timestamps": true },
      "protected": "write"
    }
  ],
  "database": { "type": "sqlite", "file": "./ecommerce.db" },
  "auth": {
    "enabled": true,
    "providers": ["credentials", "google"]
  }
}
EOF

# 2. Validar
npx archetype validate manifest.json --json

# 3. Generar
npx archetype generate manifest.json

# 4. Push a DB
npx drizzle-kit push

# 5. Listo!
npm run dev
```

### Resultado:

```
generated/
├── db/
│   ├── schema.ts           # Drizzle tables (Product, Customer, Order, OrderItem)
│   └── auth-schema.ts      # Auth tables
├── schemas/
│   ├── product.ts          # Zod validation
│   ├── customer.ts
│   └── order.ts
├── trpc/routers/
│   ├── product.ts          # CRUD + pagination + filtros
│   ├── customer.ts         # CRUD protegido (auth required)
│   └── order.ts            # CRUD + relaciones many-to-many
└── hooks/
    ├── useProduct.ts       # useProducts(), useCreateProduct(), etc.
    ├── useCustomer.ts
    └── useOrder.ts
```

**800+ líneas de código en 3 comandos.**

## Ventajas del Workflow JSON

| Aspecto | TypeScript Files | JSON Manifest |
|---------|-----------------|---------------|
| **Archivos** | 5+ archivos | 1 archivo |
| **Sintaxis** | Compleja (fluent API) | Simple (JSON) |
| **Comandos** | `init` + `generate` | `generate` solamente |
| **Validación** | Solo en generate | `validate` separado |
| **Tokens** | ~2000 tokens | ~500 tokens |
| **Tiempo** | 30 segundos | 3 segundos |

## Cuándo Usar Cada Enfoque

### Usa JSON Manifest Cuando:
- ✅ Usuario describe app completa ("blog", "e-commerce", "task manager")
- ✅ Crear múltiples entidades de una vez
- ✅ Proyecto nuevo desde cero

### Usa TypeScript Files Cuando:
- ✅ Modificar una entidad existente
- ✅ Agregar un campo a entidad ya creada
- ✅ Usuario pide explícitamente "archivos TypeScript"

## Próximos Pasos

1. ✅ **JSON manifest workflow** - Ya funciona (ver CLAUDE.md)
2. ✅ **MCP server** - Implementado (`npx archetype mcp`)
3. 🚧 **Claude Desktop integration** - Próximamente
4. 🚧 **Cursor MCP support** - Esperando soporte oficial

## Referencias

- **CLAUDE.md** - Guía completa para Claude Code (inglés)
- **MCP_SERVER.md** - Documentación del MCP server
- **documentation/AI_INTEGRATION.md** - Integración con APIs de AI
