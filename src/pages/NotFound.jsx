import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-green-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-800 transition-colors"
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
