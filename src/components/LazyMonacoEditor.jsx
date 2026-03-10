import { lazy, Suspense } from 'react';

// Lazy load Monaco Editor to reduce initial bundle size
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const LazyMonacoEditor = (props) => {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-full bg-gray-900 text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mx-auto mb-2"></div>
            <div className="text-sm">Loading code editor...</div>
          </div>
        </div>
      }
    >
      <MonacoEditor {...props} />
    </Suspense>
  );
};

export default LazyMonacoEditor;
