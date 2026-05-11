# 📦 ORACLE — Installation & Packaging

Scripts and formulas for installing ORACLE on macOS.

## What is ORACLE?

ORACLE is a **minimal setup** for streaming Android camera to a macOS desktop widget:

1. **Android**: IP Webcam app (from Play Store)
2. **Network**: Tailscale (encrypted private IP)
3. **Mac**: Übersicht widget (displays stream)

---

## Installation Methods

### Method 1: Manual (Recommended)

```bash
# 1. Install Übersicht
brew install uebersicht

# 2. Create widget directory
mkdir -p ~/Library/Application\ Support/Übersicht/widgets/oracle.widget

# 3. Copy widget
cp ../widget/index.jsx ~/Library/Application\ Support/Übersicht/widgets/oracle.widget/

# 4. Edit with your phone's Tailscale IP
nano ~/Library/Application\ Support/Übersicht/widgets/oracle.widget/index.jsx
```

### Method 2: Homebrew (Optional)

If you publish to Homebrew:

```bash
brew tap yourname/oracle
brew install oracle-widget
```

---

## Files

### `oracle-widget` (Optional Setup Script)

Interactive configuration script. Usage:

```bash
oracle-widget setup
```

Prompts for:
- Android device's Tailscale IP
- Saves config to `~/.oracle/config.json`

### `homebrew_formula.rb`

Homebrew formula for easy installation.

---

## Publishing to Homebrew

### 1. Create GitHub Repo

```bash
mkdir homebrew-oracle
cd homebrew-oracle
git init
```

### 2. Create Formula

Create `Formula/oracle-widget.rb`:

```ruby
class OracleWidget < Formula
  desc "ORACLE — Live Camera Widget for macOS"
  homepage "https://github.com/yourname/homebrew-oracle"
  url "https://github.com/yourname/oracle/archive/v1.0.0.tar.gz"
  sha256 "abc123..."
  version "1.0.0"

  depends_on "uebersicht"

  def install
    widget_path = "#{ENV['HOME']}/Library/Application Support/Übersicht/widgets/oracle.widget"
    system "mkdir -p '#{widget_path}'"
    
    # Copy widget files
    system "cp #{buildpath}/widget/index.jsx '#{widget_path}/'"
    
    # Copy setup script
    bin.install "#{buildpath}/packaging/oracle-widget"
    bin.chmod 0755, "oracle-widget"
  end

  def post_install
    puts "\n✅ ORACLE Widget installed!"
    puts "\n📝 Next: Edit widget to set your phone's Tailscale IP"
    puts "   nano ~/Library/Application\\ Support/Übersicht/widgets/oracle.widget/index.jsx"
    puts "\n🎬 Then open Übersicht (⌘Space + 'Übersicht')"
  end

  test do
    assert_file_exists "#{ENV['HOME']}/Library/Application Support/Übersicht/widgets/oracle.widget/index.jsx"
  end
end
```

### 3. Calculate SHA256

```bash
shasum -a 256 oracle-v1.0.0.tar.gz
```

Update in formula.

### 4. Push to GitHub

```bash
git add Formula/
git commit -m "Initial oracle-widget formula"
git tag v1.0.0
git push origin v1.0.0
```

### 5. Create Tap

In `homebrew-oracle` repo:

```bash
git push origin main
```

### 6. Users Can Install

```bash
brew tap yourname/oracle
brew install oracle-widget
```

---

## Alternative: Simple Setup Script

Instead of Homebrew, create `oracle-setup.sh`:

```bash
#!/bin/bash

echo "🎬 ORACLE Widget Setup"
echo "====================="
echo ""
echo "Enter your Android phone's Tailscale IP (100.x.x.x):"
read IP

# Create widget
mkdir -p ~/Library/Application\ Support/Übersicht/widgets/oracle.widget

# Generate widget with IP
cat > ~/Library/Application\ Support/Übersicht/widgets/oracle.widget/index.jsx << EOF
export const refreshFrequency = false;
export const className = \`
  top: 30px;
  right: 30px;
  width: 360px;
  height: 240px;
  background: rgba(15,15,15,0.7);
  backdrop-filter: blur(20px);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.45);
  border: 1px solid rgba(255,255,255,0.08);
\`;

const STREAM_URL = "http://$IP:8080/video";

export const render = () => {
  return \`
    <div style="width:100%;height:100%;position:relative;background:#000;">
      <img src="\${STREAM_URL}" style="width:100%;height:100%;object-fit:cover;" />
      <div style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.6);padding:6px 10px;border-radius:10px;color:#06b6d4;font-family:monospace;font-size:12px;letter-spacing:1px;font-weight:bold;">
        🎬 ORACLE LIVE
      </div>
    </div>
  \`;
};
EOF

echo "✅ Widget created!"
echo "🎬 Open Übersicht to see it (⌘Space + 'Übersicht')"
```

Usage:

```bash
chmod +x oracle-setup.sh
./oracle-setup.sh
```

---

## Troubleshooting

### Widget doesn't appear after install
- Restart Übersicht: ⌘Q then reopen
- Check file exists: `ls ~/Library/Application\ Support/Übersicht/widgets/oracle.widget/`
- Verify Tailscale IP in `index.jsx`

### "Permission denied" error
```bash
chmod +x ./oracle-widget
```

### Homebrew formula won't install
- Check SHA256 matches actual archive
- Verify GitHub URL is public
- Run `brew doctor` for diagnostics

---

## Contributing

Improvements welcome! Consider:
- Better setup script UX
- Cross-platform support
- Configuration GUI
- Widget customization options

---

## License

MIT
