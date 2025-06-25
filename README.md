# Sample API for VerdeFlow

This is a lightweight Express.js API for testing VerdeFlow's green coding measurement tools. It includes basic CRUD routes on a fake user store.

## Usage

```bash
npm install
npm start
```

## Endpoints

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

## Example Request Body (POST/PUT)

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```
