import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Đã có lỗi xảy ra trong quá trình vận hành ứng dụng.";
      
      // Check if it's a Firebase error JSON string as per instructions
      try {
        const parsedError = JSON.parse(this.state.error?.message || "");
        if (parsedError.error && parsedError.operationType) {
          errorMessage = `Lỗi Firestore (${parsedError.operationType}): ${parsedError.error}`;
        }
      } catch (e) {
        // Not a JSON error, use default or raw message
        if (this.state.error?.message) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-md w-full border-red-100 shadow-xl">
            <CardHeader className="bg-red-50 text-red-700 rounded-t-xl border-b border-red-100">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <CardTitle className="text-lg">Rất tiếc!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 text-center space-y-6">
              <p className="text-gray-600 leading-relaxed">
                {errorMessage}
              </p>
              <Button 
                variant="primary" 
                className="w-full h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Tải lại trang
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
