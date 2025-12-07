# Petch - AI Coding Agent Instructions

## Project Overview
Petch is a pet adoption platform with a **Spring Boot 3.5 API** (`petch-api/`) and **React Router v7 frontend** (`web-client/`). Users are `ADOPTER` (pet seekers) or `VENDOR` (breeders/shelters).

## Architecture

### Backend (`petch-api/`)
- **Stack**: Java 21, Spring Boot 3.5, PostgreSQL, JWT authentication
- **Package**: `project.petch.petch_api` → `config/`, `controller/`, `dto/`, `exception/`, `models/`, `repositories/`, `service/`
- **Public endpoints**: `/api/auth/**`, `/api/public/**` — all others require Bearer token
- **DTOs**: Use Java records with Jakarta validation (see [`RegisterRequest.java`](file:///home/jhadem/SCHOOLWORK/FINAL%20PROJECT/petch/petch-api/src/main/java/project/petch/petch_api/dto/auth/RegisterRequest.java))

### Frontend (`web-client/`)
- **Stack**: React Router v7 (SSR), TypeScript, TailwindCSS, Radix UI
- **Auth**: HTTP-only cookies via [`session.server.ts`](file:///home/jhadem/SCHOOLWORK/FINAL%20PROJECT/petch/web-client/app/services/session.server.ts), NOT localStorage
- **Routes**: Defined in [`routes.ts`](file:///home/jhadem/SCHOOLWORK/FINAL%20PROJECT/petch/web-client/app/routes.ts), files in `app/routes/petch+/`

## Key Patterns

### Backend Controller Example
```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor  // Lombok constructor injection
public class AuthenticationController {
    private final AuthenticationService authenticationService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }
}
```

### Frontend Route Example (loader/action pattern)
```typescript
// app/routes/petch+/login.tsx
export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  if (user) return redirect('/');
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  // Validate and call auth service
  return await createUserSession(request, response, '/');
}

export default function Login() { /* React component */ }
```

### Authenticated API Calls (always server-side)
```typescript
import { getSession } from '~/services/session.server';
import { createAuthFetch } from '~/services/authFetch.server';

const session = await getSession(request.headers.get('Cookie'));
const authFetch = createAuthFetch(session);
const response = await authFetch('http://localhost:8080/api/protected');
```

## Developer Commands

```bash
# Backend (petch-api/)
export JDBC_POSTGRES_URI="jdbc:postgresql://localhost:5432/petch?user=USER&password=PASS"
export JWT_SECRET="$(openssl rand -base64 64)"
mvn clean install && mvn spring-boot:run  # Runs on :8080

# Frontend (web-client/)
export SESSION_SECRET="your-session-secret"
npm install && npm run dev  # Runs on :3000
npm run typecheck           # Type validation
```

## Environment Variables
| Backend | Frontend |
|---------|----------|
| `JDBC_POSTGRES_URI` | `SESSION_SECRET` (required) |
| `JWT_SECRET` | `VITE_API_URL` (default: localhost:8080/api/auth) |
| `CORS_ALLOWED_ORIGINS` (default: localhost:3000,5173) | |

## Critical Conventions
1. **User types**: Always `ADOPTER` or `VENDOR` enum values (see [`auth.ts`](file:///home/jhadem/SCHOOLWORK/FINAL%20PROJECT/petch/web-client/app/types/auth.ts))
2. **Form handling**: Use `<Form method="post">` with server actions — no client-side `onSubmit`
3. **Protected routes**: Call `requireAuth(request)` in loaders; throws 401 if unauthorized
4. **Validation**: Jakarta annotations on backend DTOs, form validation in route actions
5. **Password**: Min 8 characters (enforced both ends)
6. **Error handling**: Backend uses [`GlobalExceptionHandler`](file:///home/jhadem/SCHOOLWORK/FINAL%20PROJECT/petch/petch-api/src/main/java/project/petch/petch_api/exception/GlobalExceptionHandler.java) for consistent JSON error responses

## File Locations
| Task | Location |
|------|----------|
| Add API endpoint | `petch-api/.../controller/` |
| Add route | `web-client/app/routes/petch+/` + register in `routes.ts` |
| Add UI component | `web-client/app/components/ui/` |
| Add reusable block | `web-client/app/components/blocks/` |
| Auth types | `web-client/app/types/auth.ts` + backend DTOs in `dto/` |

## UI Components Available
`Button`, `Card`, `Checkbox`, `Input`, `Label`, `Select`, `Separator` — import from `~/components/ui/`
