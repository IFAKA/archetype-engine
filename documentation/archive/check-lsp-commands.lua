-- Check LSP status in Neovim 0.11
print("=== LSP Status ===\n")

local bufnr = vim.api.nvim_get_current_buf()
local clients = vim.lsp.get_clients({ bufnr = bufnr })

print("Filetype: " .. vim.bo.filetype)
print("Number of LSP clients attached: " .. #clients)
print("")

if #clients == 0 then
  print("❌ NO LSP CLIENTS ATTACHED!")
  print("")
  print("Possible reasons:")
  print("1. LSP is still starting (wait 5-10 seconds)")
  print("2. LSP failed to start (check for errors)")
  print("3. File type not triggering LSP")
else
  for _, client in ipairs(clients) do
    print("✅ LSP Client: " .. client.name)
    print("   Root: " .. (client.config.root_dir or "N/A"))
    print("   Status: " .. (client.initialized and "initialized" or "initializing"))
  end
end

print("\n=== What to do next ===")
if #clients == 0 then
  print("1. Wait 10 seconds and run this script again")
  print("2. If still no LSP, check: :lua vim.lsp.log.set_level('debug')")
  print("3. Then check: tail -100 ~/.local/state/nvim/lsp.log")
else
  print("LSP is attached! Now test autocomplete:")
  print("1. Go to line 3")
  print("2. After boolean(), type a dot: .")
  print("3. Wait 1 second")
  print("4. Press Ctrl-X Ctrl-O (or Ctrl-Space)")
end
