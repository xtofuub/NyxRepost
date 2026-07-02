import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void p-4">
          <div className="p-[1px] rounded-2xl bg-gradient-to-b from-red-500/20 to-transparent max-w-md w-full">
            <div className="rounded-[calc(2rem-1px)] bg-void-mid border border-red-500/10 p-8 text-center">
              <div className="text-red-400/80 text-lg font-medium mb-2">Something went wrong</div>
              <p className="text-white/40 text-sm mb-4 font-mono">{this.state.error.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-full px-6 py-2.5 bg-white/10 text-white/80 text-sm hover:bg-white/15 transition-all duration-500"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
