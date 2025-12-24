-- Manually start the LSP
print("Starting TypeScript LSP manually...\n")

local root_dir = vim.fn.getcwd()
local ts_path = root_dir .. "/node_modules/typescript/lib"

-- Check if workspace TypeScript exists
if vim.fn.isdirectory(ts_path) == 1 then
  print("✅ Found workspace TypeScript: " .. ts_path)
else
  print("⚠️  Workspace TypeScript not found, using global")
  ts_path = nil
end

-- Start the LSP
local client_id = vim.lsp.start({
  name = 'ts_ls',
  cmd = { 'typescript-language-server', '--stdio' },
  root_dir = root_dir,
  filetypes = { 'typescript', 'typescriptreact' },
  init_options = ts_path and {
    preferences = { includePackageJsonAutoImports = "auto" },
    tsserver = { path = ts_path }
  } or {
    preferences = { includePackageJsonAutoImports = "auto" }
  },
  on_attach = function(client, bufnr)
    print("\n✅ LSP attached: " .. client.name)
    print("   Root: " .. client.config.root_dir)
  end,
})

if client_id then
  print("\nLSP starting... (id: " .. client_id .. ")")
  print("Wait 3-5 seconds, then test autocomplete.")
else
  print("\n❌ Failed to start LSP!")
  print("Check: tail -100 ~/.local/state/nvim/lsp.log")
end
