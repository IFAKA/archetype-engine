#!/bin/bash

echo "================================================"
echo "Neovim TypeScript Autocomplete Test"
echo "================================================"
echo ""

# Check files exist
echo "✅ Checking files..."
if [ ! -f "test-boolean-field.ts" ]; then
    echo "Creating test-boolean-field.ts..."
    cat > test-boolean-field.ts << 'TSFILE'
import { boolean } from './src/fields'

const b = boolean()
TSFILE
fi

echo "✅ test-boolean-field.ts exists"
echo ""

# Show config status
echo "✅ Checking LSP config..."
if grep -q "Auto-attach LSP" ~/.config/nvim/lua/lsp.lua; then
    echo "✅ LSP auto-attach is configured"
else
    echo "❌ LSP auto-attach NOT configured"
    echo "   The fix may not have been applied correctly"
fi

echo ""
echo "================================================"
echo "Opening Neovim..."
echo "================================================"
echo ""
echo "After Neovim opens:"
echo ""
echo "1. WAIT 5 SECONDS (let LSP initialize)"
echo ""
echo "2. Check LSP is attached:"
echo "   :lua print(#vim.lsp.get_clients({ bufnr = 0 }) .. \" clients\")"
echo ""
echo "3. Should show: 1 clients"
echo ""
echo "4. Go to line 3 and add a dot after boolean()"
echo "   const b = boolean()."
echo ""
echo "5. Press Ctrl-Space"
echo ""
echo "6. Should see: _config, default, label, optional, required, unique"
echo ""
echo "7. If you see 0 clients, manually start LSP:"
echo "   :luafile fix-lsp-start.lua"
echo ""
echo "Press Enter to open Neovim..."
read

nvim test-boolean-field.ts

echo ""
echo "================================================"
echo "Did autocomplete work?"
echo "================================================"
echo ""
echo "If YES: The fix worked! 🎉"
echo "If NO: Run the diagnostic:"
echo "  :luafile check-lsp-commands.lua"
echo "  and tell me what it says"
