# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-12-24

### 🤖 AI Assistant Integration

This release makes Archetype fully compatible with AI coding assistants (Claude Code, Cursor, Windsurf) through automatic generation of guidance files.

### Added

#### AI Assistant Support
- **Auto-generated `CLAUDE.md`** - Guidance file for Claude Code with rules about editable/protected directories
- **Auto-generated `.cursorrules`** - Guidance file for Cursor and Windsurf IDEs
- **Zero-config AI protection** - AI assistants automatically know to NEVER edit `generated/` directory
- **Workflow instructions** - AI follows correct entity → generate → push workflow
- **Usage examples** - AI learns from correct/incorrect code examples in guidance files

#### MCP Server (Model Context Protocol)
- **MCP Server implementation** - Direct integration with Claude Desktop and MCP-compatible clients
- **CLI command**: `npx archetype mcp` - Start MCP server for Claude Desktop
- **5 MCP tools**: `create_manifest`, `validate_manifest`, `generate_code`, `view_schema`, `generate_from_description`
- **Documentation**: `MCP_SERVER.md` with setup instructions

#### Bonus Generators
- **OpenAPI Generator** - Generate OpenAPI 3.0 spec from entities (`generated/openapi.json`)
- **Seed Generator** - Generate seed data scripts (`generated/seed.ts`)
- **Test Generator** - Generate test scaffolding for tRPC routers (`generated/tests/`)

#### Documentation (Spanish)
- **`GUIA_PARA_USUARIOS.md`** - Complete guide for AI integration (Spanish)
- **`SOLUCION_CLAUDE_CODE.md`** - Specific explanation for Claude Code users (Spanish)
- **`CURSOR_RULES_IMPLEMENTATION.md`** - Technical details of implementation
- **`AI_PARA_CLAUDE_CODE.md`** - Context for AI assistants (Spanish)

#### Developer Experience
- **AI-optimized workflow** - JSON manifest approach documented in `CLAUDE.md`
- **Faster entity creation** - Single manifest.json vs multiple TypeScript files
- **Better AI guidance** - Examples of what NOT to do (editing generated code)

### Technical Details

- **22 files changed**, 6065 lines added
- **No breaking changes** - Fully backwards compatible
- **Build passing** - All tests green
- **npm binary**: Added `archetype-mcp` for MCP server

### Migration Guide

No migration needed - this is a backwards-compatible feature release.

**For new projects:**
```bash
npx archetype init  # Now generates CLAUDE.md and .cursorrules automatically
```

**For existing projects:**
You can manually add the guidance files by running:
```bash
npx archetype init --force  # Regenerates all template files
```

Or copy from the repo:
- `.cursorrules` - For Cursor/Windsurf
- `CLAUDE.md` - For Claude Code (see `src/init/templates.ts` for template)

### Links

- [Commit](https://github.com/IFAKA/archetype-engine/commit/c2a22be)
- [Documentation](https://archetype-engine.vercel.app)
- [MCP Server Guide](https://github.com/IFAKA/archetype-engine/blob/main/MCP_SERVER.md)

---

## [2.0.0] - 2024-12-24

### 🎉 Initial Release

First public release of Archetype Engine - a type-safe backend generator for Next.js.

### Added

#### Core Features
- **Entity Definition System** - Fluent TypeScript API for defining data models
- **Field Builders** - `text()`, `number()`, `boolean()`, `date()`, `enumField()`, `computed()`
- **Relations** - `hasOne()`, `hasMany()`, `belongsToMany()` with pivot table support
- **Code Generation** - Generates Drizzle schemas, tRPC routers, Zod validation, React hooks

#### Advanced Features
- **Pagination & Filtering** - Built-in list operations with search, sort, pagination
- **Batch Operations** - `createMany`, `updateMany`, `removeMany` for bulk operations
- **Computed Fields** - Derive values from other fields at runtime
- **Enum Support** - Native database enums for PostgreSQL, validated text for SQLite
- **Lifecycle Hooks** - `beforeCreate`, `afterCreate`, etc. for business logic
- **Authentication** - NextAuth v5 integration with multiple providers
- **Multi-tenancy** - Automatic tenant filtering for isolated data access
- **i18n Support** - Multi-language validation messages

#### Templates
- **SaaS Multi-Tenant** - Workspace, Team, Member with role-based access
- **E-commerce** - Product, Order, Customer with cart and checkout
- **Blog/CMS** - Post, Author, Comment with publishing workflow
- **Task Management** - Project, Task, Label with kanban boards

#### Developer Experience
- **CLI** - Interactive `archetype init` with templates
- **ERD Viewer** - `archetype view` opens visual database diagram
- **AI Integration** - JSON API and tool definitions for AI agents
- **Type Safety** - Full TypeScript support from entity → database → API → frontend

#### Documentation
- **Architecture Decision Records** - 3 ADRs documenting design choices
- **Comprehensive Guides** - Getting started, fields, relations, hooks, auth
- **API Reference** - Complete documentation for all public APIs

### Technical Details

- **Zero Technical Debt** - 92/100 code quality score
- **Test Coverage** - 209 tests, 100% passing
- **Dependencies** - Only 4 runtime dependencies (lean bundle)
- **TypeScript Strict** - Full strict mode enabled
- **Node.js** - Requires v20.0.0 or higher

### Links

- [Documentation](https://archetype-engine.vercel.app)
- [GitHub](https://github.com/IFAKA/archetype-engine)
- [npm](https://www.npmjs.com/package/archetype-engine)

---

## Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible new features
- **PATCH** version for backwards-compatible bug fixes

## Future Releases

See [GitHub Issues](https://github.com/IFAKA/archetype-engine/issues) for planned features.

### Roadmap
- Multi-tenancy utilities (Q1 2025)
- RBAC/permissions framework (Q1 2025)
- Rate limiting (Q2 2025)
- Admin UI generator (Q2 2025)
- Additional database support (MongoDB, EdgeDB)
- More templates (Marketplace, Social Network, Analytics)
