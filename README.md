# FitShare MVC Backend

FitShare is a workout social app where users can post workout photos/text and submit structured workout data for an open workout database.

## Structure

```text
fitshare_mvc/
├── app.js
├── config/
│   └── db.js
├── controllers/
├── middleware/
├── models/
├── routes/
├── utils/
├── public/uploads/
├── database/
│   ├── reset.sql
│   ├── schema.sql
│   └── seed.sql
└── views/
```

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your MySQL password.

## Create the database

From the project folder:

```bash
mysql -u root -p < database/reset.sql
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

## Run

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Important routes

### Auth

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
```

### Profiles

```text
GET /profiles/:username
PUT /profiles/me
```

### Exercises database

```text
GET  /exercises
POST /exercises
```

### Workout posts

```text
GET    /workouts
GET    /workouts/:slug
POST   /workouts
PUT    /workouts/:postId
DELETE /workouts/:postId
```

### Comments and interactions

```text
POST   /workouts/:postId/comments
PUT    /comments/:commentId
DELETE /comments/:commentId
POST   /workouts/:postId/like
POST   /workouts/:postId/bookmark
GET    /bookmarks/me
POST   /workouts/:postId/share
```

## Creating workout posts

For `POST /workouts`, send `multipart/form-data` if you include an image.

The `exercises` field should be a JSON array string:

```json
[
  {
    "exercise_id": 1,
    "set_count": 3,
    "reps": 12,
    "rest_between_sets_seconds": 60,
    "rest_after_exercise_seconds": 120
  },
  {
    "exercise_id": 3,
    "set_count": 3,
    "time_seconds": 45,
    "rest_between_sets_seconds": 60
  }
]
```

The `hashtags` field can be either a JSON array string:

```json
["beginner", "homeworkout"]
```

or a comma-separated string:

```text
beginner, homeworkout
```
