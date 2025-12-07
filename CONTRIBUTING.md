# Contributing to Modex Ticket Booking System

We welcome contributions! This guide will help you get started.

## Getting Started

### Prerequisites
- Node.js v16+ (frontend) and v14+ (backend)
- PostgreSQL 12+
- Git

### Setup Development Environment

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd modex-ticket
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your configuration
npm run dev
```

3. **Setup Frontend**
```bash
cd frontend
npm install
cp .env.example .env
# .env should already have correct localhost URL
npm run dev
```

## Code Style Guidelines

### JavaScript/TypeScript
- Use `const` for constants, `let` for variables
- Avoid `var`
- Use meaningful variable names
- Add JSDoc comments for functions
- Use async/await instead of callbacks

```javascript
/**
 * Books seats for a show
 * @param {number} showId - The show ID
 * @param {string[]} seatNumbers - Array of seat numbers to book
 * @returns {Promise<Object>} Booking details
 */
async function bookSeats(showId, seatNumbers) {
  // Implementation
}
```

### React/TypeScript
- Use functional components with hooks
- Type all props with TypeScript interfaces
- Use context API for state management
- Prefer custom hooks for reusable logic
- Keep components small and focused

```typescript
interface BookingFormProps {
  showId: number;
  onBooking: (bookingId: number) => void;
  isLoading: boolean;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  showId,
  onBooking,
  isLoading,
}) => {
  // Component implementation
};
```

### CSS
- Use BEM methodology for class names
- Keep CSS scoped to component
- Use CSS variables for colors and sizes
- Mobile-first responsive design

```css
.booking-form {
  /* Component styles */
}

.booking-form__header {
  /* Header styles */
}

.booking-form__button {
  /* Button styles */
}

.booking-form__button--disabled {
  /* Disabled state */
}
```

## Commit Message Guidelines

Use clear, descriptive commit messages:

```
feat: Add seat availability filtering
fix: Correct concurrency handling in booking
docs: Update API documentation
refactor: Simplify booking controller
test: Add booking expiry tests
chore: Update dependencies
```

## Pull Request Process

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Run tests (if available)
npm test
```

4. **Commit and push**
```bash
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name
```

5. **Create Pull Request**
   - Clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

## What to Contribute

### High Priority
- Unit tests for controllers
- Integration tests for API endpoints
- Error handling improvements
- Performance optimizations
- Documentation improvements

### Medium Priority
- New features (with discussion first)
- UI/UX improvements
- Code refactoring
- Additional deployment options

### Lower Priority
- Style changes
- Comment additions
- Minor fixes

## Code Review Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines
- [ ] All functions have JSDoc comments
- [ ] TypeScript types are defined
- [ ] No console.log statements remain
- [ ] Error handling is comprehensive
- [ ] Tests pass (if applicable)
- [ ] Documentation is updated
- [ ] No hardcoded values (use config/env)
- [ ] CRUD operations use proper HTTP methods
- [ ] Database operations are atomic

## Testing

### Running Tests
```bash
# Backend tests (when available)
cd backend && npm test

# Frontend tests (when available)
cd frontend && npm test

# Linting
npm run lint
```

### Writing Tests
- Write descriptive test names
- Test happy paths and error cases
- Mock external dependencies
- Use setup/teardown for database tests

Example:
```javascript
describe('bookSeats', () => {
  it('should book available seats successfully', async () => {
    // Test implementation
  });

  it('should prevent overbooking concurrent requests', async () => {
    // Test implementation
  });

  it('should return 404 if show not found', async () => {
    // Test implementation
  });
});
```

## Database Changes

If modifying the database schema:

1. Update `src/db.js` with new schema
2. Write migration notes in PR description
3. Test with fresh database initialization
4. Update `TECHNICAL_DESIGN.md` if needed

## Performance Guidelines

- Avoid N+1 queries
- Use indexes for frequently queried columns
- Implement database connection pooling
- Cache when appropriate
- Use pagination for large datasets
- Profile before optimizing

## Security Considerations

- Never commit `.env` files with secrets
- Use parameterized queries (already implemented)
- Validate all user inputs
- Implement rate limiting
- Use HTTPS in production
- Keep dependencies updated

## Questions or Need Help?

1. Check existing documentation
2. Search issues for similar problems
3. Open an issue with detailed description
4. Ask in pull request comments

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

**Thank you for contributing! 🎉**
