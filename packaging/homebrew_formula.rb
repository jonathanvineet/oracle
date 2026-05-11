class LivecamWidget < Formula
  desc "WODGET EVERYTHING ORACLE — Live camera macOS widget"
  homepage "https://example.com/oracle"
  url "https://example.com/downloads/livecam-widget-0.1.0.dmg"
  sha256 "TODO:replace-with-sha256"
  license "MIT"

  def install
    prefix.install Dir['*']
  end

  caveats <<~EOS
    This is an example formula. Replace the URL and sha256 with the real DMG.
  EOS

  test do
    system "true"
  end
end
