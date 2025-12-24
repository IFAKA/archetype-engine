# Why LSP Isn't Auto-Starting

## The Problem

`0 clients attached` means the LSP is configured but not automatically attaching to your TypeScript files.

## Likely Causes (Neovim 0.11)

### 1. vim.lsp.enable() might need manual trigger
In Neovim 0.11, `vim.lsp.enable()` defines servers but might not auto-attach immediately.

### 2. Treesitter is compiling
While treesitter compiles parsers on first run, LSP might be waiting.

### 3. Missing auto-attach trigger
The LSP might need an explicit FileType autocmd.

## The Fix

I've created `fix-lsp-start.lua` which manually starts the LSP.

### In Neovim, run:
```vim
:luafile fix-lsp-start.lua
```

This will:
1. Find your workspace TypeScript
2. Start the LSP manually with correct settings
3. Show confirmation when it attaches

### After Running

Wait 5 seconds, then:
1. Check: `:lua print(#vim.lsp.get_clients({ bufnr = 0 }) .. " clients")`
2. Should now show: `1 clients`
3. Test autocomplete: Go to line 3, add `.` after `boolean()`
4. Press `Ctrl-Space` or `Ctrl-X Ctrl-O`

## Permanent Fix

If manual start works, the issue is the auto-attach. I'll need to update `~/.config/nvim/lua/lsp.lua` to add:

```lua
-- Auto-attach LSP to TypeScript files
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "typescript", "typescriptreact", "javascript", "javascriptreact" },
  callback = function()
    vim.lsp.start(vim.lsp.config.ts_ls)
  end,
})
```

But first, let's confirm manual start works!

## Run This Now

```vim
:luafile fix-lsp-start.lua
```

Then tell me if you see:
```
✅ LSP attached: ts_ls
```
