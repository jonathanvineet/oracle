# 📦 ORACLE — Installation & Packaging

Scripts and formulas for installing ORACLE on macOS.

## Installation Methods

### Method 1: Homebrew (Recommended)

```bash
brew tap yourname/oracle
brew install oracle-widget
oracle-widget setup
```

### Method 2: Manual Installation

```bash
git clone https://github.com/yourname/oracle.git
cd oracle/packaging
chmod +x oracle-widget
./oracle-widget setup
```

### Method 3: From Source

```bash
git clone https://github.com/yourname/oracle.git
cd oracle

# Copy widget to Übersicht
cp -r widget ~/Library/Application\ Support/Übersicht/widgets/oracle

# Run setup
bash packaging/oracle-widget setup
```

## Files

### `oracle-widget`

Main setup and configuration script. 

**Usage:**

```bash
oracle-widget setup          # Configure stream IP and password
oracle-widget --help         # Show help
```

**What it does:**

1. Verifies Übersicht is installed
2. Prompts for Android device's Tailscale IP
3. Saves configuration to `~/.oracle/config.json`
4. Copies widget files to Übersicht folder
5. Opens Übersicht to display widget

### `homebrew_formula.rb`

Homebrew formula for easy installation.

**Publishing:**

1. Create GitHub releases with `oracle-widget-X.Y.Z.tar.gz`
2. Update SHA256 in formula
3. Update URLs in formula
4. Publish to Homebrew tap

## Building Releases

### Create Release Tarball

```bash
# From repo root
tar -czf oracle-widget-1.0.0.tar.gz widget/ packaging/oracle-widget

# Calculate SHA256
sha256sum oracle-widget-1.0.0.tar.gz
# Or on macOS:
shasum -a 256 oracle-widget-1.0.0.tar.gz
```

### Update Formula

Edit `homebrew_formula.rb`:

```ruby
url "https://github.com/yourname/oracle/releases/download/v1.0.0/oracle-widget-1.0.0.tar.gz"
sha256 "abc123def456..."  # Paste SHA256 above
```

### Create GitHub Release

1. Tag version: `git tag v1.0.0`
2. Push: `git push origin v1.0.0`
3. Create release on GitHub
4. Upload `oracle-widget-1.0.0.tar.gz`

## Configuration

After installation, configure with:

```bash
oracle-widget setup
```

Configuration saved to: `~/.oracle/config.json`

```json
{
  "streamUrl": "http://100.x.x.x:8080/video",
  "password": "oracle123",
  "refreshInterval": 5000
}
```

## Troubleshooting

### "Übersicht not found"

Install Übersicht:

```bash
brew install uebersicht
```

### Script permission denied

```bash
chmod +x packaging/oracle-widget
```

### Widget doesn't appear after installation

1. Restart Übersicht (⌘Q and reopen)
2. Check widget folder: `ls ~/Library/Application\ Support/Übersicht/widgets/oracle`
3. Verify config: `cat ~/.oracle/config.json`

## Uninstallation

### Via Homebrew

```bash
brew uninstall oracle-widget
```

### Manual

```bash
rm -rf ~/Library/Application\ Support/Übersicht/widgets/oracle
rm -rf ~/.oracle
```

## Contributing

Improvements welcome! Submit PRs with:

- Updates to setup script
- Better error handling
- New installation methods
- Cross-platform support

## License

MIT
