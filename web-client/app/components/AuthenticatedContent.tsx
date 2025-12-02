import { Form } from 'react-router';
import type { User } from '../types/auth';

interface AuthenticatedContentProps {
  user: User;
}

export function AuthenticatedContent({ user }: AuthenticatedContentProps) {
  return (
    <div className="space-y-4">
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
        <p className="font-semibold">You are logged in!</p>
        <div className="mt-2 text-sm">
          <p>
            <strong>Name:</strong> {user.firstName} {user.lastName}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Account Type:</strong> {user.userType}
          </p>
        </div>
      </div>

      <Form method="post" action="/logout">
        <button 
          type="submit" 
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </Form>
    </div>
  );
}
