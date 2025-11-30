import { Form } from 'react-router';
import type { User } from '../types/auth';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';

interface AuthenticatedContentProps {
  user: User;
}

export function AuthenticatedContent({ user }: AuthenticatedContentProps) {
  return (
    <div className="space-y-4">
      <Alert variant="success">
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
      </Alert>

      <Form method="post" action="/logout">
        <Button type="submit" variant="danger">
          Logout
        </Button>
      </Form>
    </div>
  );
}
