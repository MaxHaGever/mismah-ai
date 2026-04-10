#User Backend Template

A secure, modular, and fully tested backend starter built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**.

This project includes everything you need to build a modern backend, with JWT authentication, password hashing, input validation, centralized error handling, and automated tests.

Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation via express-validator
- Centralized error handling
- HTTP request logging (morgan)
- Secure headers (helmet)
- Cross-origin support (CORS)
- Full Jest + Supertest test suite
- VS Code debugger friendly

src/
├── controllers/       # Auth handlers
├── middleware/        # JWT auth, error handling, validators
├── models/            # User model (Mongoose)
├── routes/            # Express routes
├── tests/             # Jest + Supertest tests
├── utils/             # Token, helpers
├── index.ts           # App entry point

* Backend is stateless — logout is handled by client clearing token
* Tests run on mongodb-memory-server
* JWTs expire in 1 hour (adjust in generateToken.ts)
* process.env.NODE_ENV controls logging/debug mode