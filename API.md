AUTH

POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me


REPOSITORIES

POST   /api/repositories
GET    /api/repositories
GET    /api/repositories/:repoId
PATCH  /api/repositories/:repoId
DELETE /api/repositories/:repoId


CODE FILES

POST   /api/repositories/:repoId/files
GET    /api/repositories/:repoId/files

GET    /api/codefiles/:fileId
PATCH  /api/codefiles/:fileId
DELETE /api/codefiles/:fileId