class OracleWidget < Formula
  desc "🎬 ORACLE — Live Camera Widget. Lightweight Übersicht widget for streaming from Android via Tailscale"
  homepage "https://github.com/yourusername/oracle"
  url "https://github.com/yourusername/oracle/releases/download/v1.0.0/oracle-widget-1.0.0.tar.gz"
  sha256 "abc123def456..." # Update with actual release
  license "MIT"

  depends_on "uebersicht"

  def install
    # Install widget files
    widget_dir = prefix / "widget"
    widget_dir.install Dir["widget/*"]

    # Install setup script
    bin.install "packaging/oracle-widget"
    bin.chmod 0755, "oracle-widget"
  end

  def post_install
    puts ""
    puts "🎬 ORACLE Widget installed!"
    puts ""
    puts "Next steps:"
    puts "1. Run:   oracle-widget setup"
    puts "2. Enter your Android device's Tailscale IP"
    puts "3. Open Übersicht (⌘Space + type 'Übersicht')"
    puts ""
    puts "For more info: oracle-widget --help"
    puts ""
  end

  test do
    system "oracle-widget", "--help"
  end
end
