export default function Footer() {
  return (
    <footer id="footer" className="relative px-4 py-16 border-t border-white/[0.03]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm text-white/15">
            NyxRepost - TikTok Repost Insights
          </span>
          <div className="flex items-center gap-6">
            <span className="text-xs text-white/20">
              Data via tiktokrepostremover.com
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
