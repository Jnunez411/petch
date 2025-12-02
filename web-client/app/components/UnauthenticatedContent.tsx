import { Link } from 'react-router';

export function UnauthenticatedContent() {
  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
        Please login or register to continue
      </p>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="flex-1 text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Login
        </Link>
        <Link
          to="/signup"
          className="flex-1 text-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
