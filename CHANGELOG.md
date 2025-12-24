# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2024-12-24

### 🚀 Developer Experience Improvements

Major improvements to CLI commands and project scripts organization.

### Added

#### New CLI Commands
- **`archetype docs`** - Serve OpenAPI/Swagger UI documentation in browser (port 3334)
  - Interactive API testing with Swagger UI
  - Auto-opens browser like `archetype view`
  - Reads from `generated/docs/openapi.json`

#### New Project Scripts (Auto-added by `npx archetype init`)
- **`archetype:docs`** - View API documentation (Swagger UI)
- **`archetype:check`** - Validate manifest without generating code
- **`db:seed`** - Seed database with sample data
- **`db:seed:reset`** - Reset database and seed with fresh data
- **test:api** - Run generated Vitest tests

#### Enhanced Dependencies
- **`tsx`** - Added as dev dependency for running seed scripts
- **`vitest`** - Added as dev dependency for running tests

### Changed

- **Script Organization** - All scripts now follow clean namespace patterns:
  - `archetype:*` - Code generation, docs, validation
  - `db:*` - Database operations (schema, studio, seeding)
  - `test:*` - Testing commands
  - No namespace conflicts with Next.js native commands

- **README** - Added comprehensive CLI Commands section with:
  - All Archetype CLI commands
  - Project scripts reference
  - Common workflow examples

- **Documentation Templates** - Updated `CLAUDE.md` and README templates with all new commands

### Fixed

- **OpenAPI CORS Issue** - Swagger UI no longer tries to load via `file://` protocol
  - Now served via HTTP on port 3334
  - Fixes "Cross origin requests" browser error

### Technical Details

- **Files changed**: 5 (cli.ts, templates.ts, dependencies.ts, README.md, CHANGELOG.md)
- **No breaking changes** - Fully backwards compatible
- **Existing projects** - Can manually add scripts to package.json

### Migration Guide

**For new projects:**
```bash
npx archetype init  # Now includes all new scripts automatically
```

**For existing projects:**
Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "archetype:docs": "archetype docs",
    "archetype:check": "archetype validate",
    "db:seed": "tsx generated/seeds/run.ts",
    "db:seed:reset": "tsx generated/seeds/run.ts --reset",
    "test:api": "vitest run generated/tests"
  },
  "devDependencies": {
    "tsx": "latest",
    "vitest": "latest"
  }
}
```

## [2.2.0] - 2024-12-24

### 📚 Documentation Improvements

Major documentation overhaul to sync website docs with codebase capabilities.

### Added

#### New Documentation Pages
- **JSON Manifest Guide** (`json-manifest.md`) - Complete guide for AI-optimized workflow
  - Field definitions with all types and validations
  - Relations (hasOne, hasMany, belongsToMany)
  - Complete e-commerce example
  - CLI validation commands
- **External Sources Guide** (`external-sources.md`) - Headless mode and external API integration
  - Configuration options (path prefix, resource names, endpoint overrides)
  - Authentication (Bearer, API Key)
  - Use cases (Headless CMS, Legacy APIs, Microservices)
  - Hybrid mode (database + external sources)

### Fixed

- **Relations Documentation** - Corrected `hasOne()` usage (was incorrectly showing `belongsTo()` which doesn't exist)
- **CLI Commands** - Added missing `validate` and `generate manifest.json` commands
- **Generated Code** - Enhanced with complete code examples for validation and routers

### Changed

- **Modes Documentation** - Updated to show all generators (tests, docs, seeds, i18n) in output
- **Intro Page** - Added i18n to generated output list
- **Website Sidebar** - Added new doc pages to Advanced section
- **Generated Code Reference** - Expanded validation and API router sections with code examples

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
