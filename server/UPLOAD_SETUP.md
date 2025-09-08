# Image Upload Setup

## Environment Variables

Add the following environment variable to your `.env` file:

```env
BACKEND_URL=http://localhost:5000
```

This ensures that uploaded images are served with the correct full URL.

## Directory Structure

```
server/
├── uploads/
│   └── products/
│       └── [uploaded images]
```

## API Endpoints

- `POST /api/admin/upload/image` - Upload single image
- `POST /api/admin/upload/images` - Upload multiple images

Both endpoints require admin authentication.

## Image URLs

Uploaded images are accessible at:
- `http://localhost:5000/uploads/products/[filename]`

The API returns full URLs including the backend URL for proper display in the frontend.
