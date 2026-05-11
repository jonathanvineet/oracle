class OracleWidget < Formula
  desc "🎬 ORACLE — Live Camera Widget. Android IP Webcam → Tailscale → macOS Übersicht"
  homepage "https://github.com/yourusername/oracle"
  url "https://github.com/yourusername/oracle/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "abc123def456..." # Replace with actual release SHA256
  license "MIT"
  version "1.0.0"

  depends_on "uebersicht"

  def install
    # Create widget directory
    widget_dir = "#{ENV['HOME']}/Library/Application Support/Übersicht/widgets/oracle.widget"
    system "mkdir -p '#{widget_dir}'"

    # Copy widget file
    system "cp #{buildpath}/widget/index.jsx '#{widget_dir}/'"

    # Install setup script
    bin.install "#{buildpath}/packaging/oracle-setup"
    bin.chmod 0755, "oracle-setup"
  end

  def post_install
    puts "\n✅ ORACLE Widget installed!"
    puts "\n🎬 Quick start:"
    puts "   1. Run: oracle-setup"
    puts "   2. Enter your Android device's Tailscale IP"
    puts "   3. Open Übersicht (⌘Space + type 'Übersicht')"
    puts "\n📖 Full setup: https://github.com/yourusername/oracle#quick-start"
  end

  test do
    system "test", "-f", "#{bin}/oracle-setup"
  end
end
