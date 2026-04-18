
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-red-500/10 p-6 rounded-full mb-6">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2 italic tracking-tighter uppercase">识海震荡 · 功法出偏</h1>
          <p className="text-zinc-400 mb-8 max-w-xs text-sm">
            抱歉，系统运行出现了一些紊乱（可能是照片文件过大或内存不足）。
          </p>
          <div className="space-y-3 w-full max-w-xs">
            <Button 
              className="w-full bg-[#E63946] hover:bg-red-600 text-white font-bold h-12 rounded-2xl"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              重新运功 (刷新)
            </Button>
            <Button 
              variant="ghost"
              className="w-full text-zinc-500 hover:text-white"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              清除所有缓存并重置
            </Button>
          </div>
          {this.state.error && (
            <pre className="mt-8 p-4 bg-zinc-900 rounded-xl text-[10px] text-zinc-600 text-left overflow-auto max-w-full">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
