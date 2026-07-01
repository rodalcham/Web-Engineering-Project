-- schema.sql
-- Main database schema for FitShare / open workout database.
-- This file creates all tables needed for the project.

CREATE DATABASE IF NOT EXISTS fitshare_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitshare_db;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS bookmarks;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS workout_post_hashtags;
DROP TABLE IF EXISTS hashtags;
DROP TABLE IF EXISTS workout_post_exercises;
DROP TABLE IF EXISTS workout_posts;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS workout_goals;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users: authentication data.
CREATE TABLE users (
  user_id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB;

-- 2. Profiles: public user profile data.
CREATE TABLE profiles (
  profile_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  display_name VARCHAR(100),
  bio TEXT,
  age INT,
  profile_picture_url VARCHAR(255),
  fitness_level ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (profile_id),
  CONSTRAINT fk_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Workout goals: purpose of the workout.
CREATE TABLE workout_goals (
  goal_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  PRIMARY KEY (goal_id)
) ENGINE=InnoDB;

-- 4. Categories: broad workout type.
CREATE TABLE categories (
  category_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  PRIMARY KEY (category_id)
) ENGINE=InnoDB;

-- 5. Exercises: reusable open-source exercise database.
CREATE TABLE exercises (
  exercise_id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(180) NOT NULL UNIQUE,
  description TEXT,
  muscle_group VARCHAR(100),
  equipment VARCHAR(100),
  difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'beginner',
  image_url VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (exercise_id),
  FULLTEXT INDEX ft_exercises_search (name, description)
) ENGINE=InnoDB;

-- 6. Workout posts: main CRUD content type.
CREATE TABLE workout_posts (
  post_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  goal_id INT,
  category_id INT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  caption TEXT,
  image_url VARCHAR(255),
  total_duration_minutes INT,
  rest_between_exercises_seconds INT,
  visibility ENUM('public', 'private') NOT NULL DEFAULT 'public',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (post_id),
  CONSTRAINT fk_workout_posts_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_workout_posts_goal
    FOREIGN KEY (goal_id) REFERENCES workout_goals(goal_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_workout_posts_category
    FOREIGN KEY (category_id) REFERENCES categories(category_id)
    ON DELETE SET NULL,
  INDEX idx_workout_posts_user (user_id),
  INDEX idx_workout_posts_goal (goal_id),
  INDEX idx_workout_posts_category (category_id),
  INDEX idx_workout_posts_created_at (created_at),
  FULLTEXT INDEX ft_workout_posts_search (title, caption)
) ENGINE=InnoDB;

-- 7. Workout post exercises: structured exercise data inside a post.
CREATE TABLE workout_post_exercises (
  workout_exercise_id INT NOT NULL AUTO_INCREMENT,
  post_id INT NOT NULL,
  exercise_id INT NOT NULL,
  exercise_order INT NOT NULL,
  set_count INT NOT NULL,
  reps INT,
  time_seconds INT,
  rest_between_sets_seconds INT,
  rest_after_exercise_seconds INT,
  notes TEXT,
  PRIMARY KEY (workout_exercise_id),
  CONSTRAINT fk_workout_post_exercises_post
    FOREIGN KEY (post_id) REFERENCES workout_posts(post_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_workout_post_exercises_exercise
    FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_post_exercise_order (post_id, exercise_order),
  INDEX idx_workout_post_exercises_post (post_id),
  INDEX idx_workout_post_exercises_exercise (exercise_id)
) ENGINE=InnoDB;

-- 8. Hashtags: flexible social tags.
CREATE TABLE hashtags (
  hashtag_id INT NOT NULL AUTO_INCREMENT,
  tag VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (hashtag_id)
) ENGINE=InnoDB;

-- 9. Many-to-many relation between workout posts and hashtags.
CREATE TABLE workout_post_hashtags (
  post_id INT NOT NULL,
  hashtag_id INT NOT NULL,
  PRIMARY KEY (post_id, hashtag_id),
  CONSTRAINT fk_workout_post_hashtags_post
    FOREIGN KEY (post_id) REFERENCES workout_posts(post_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_workout_post_hashtags_hashtag
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(hashtag_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Comments: user feedback on workout posts.
CREATE TABLE comments (
  comment_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (comment_id),
  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES workout_posts(post_id)
    ON DELETE CASCADE,
  INDEX idx_comments_post (post_id),
  INDEX idx_comments_user (user_id)
) ENGINE=InnoDB;

-- 11. Likes: users can like a workout post once.
CREATE TABLE likes (
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  CONSTRAINT fk_likes_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_likes_post
    FOREIGN KEY (post_id) REFERENCES workout_posts(post_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Bookmarks: users can save workouts.
CREATE TABLE bookmarks (
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  CONSTRAINT fk_bookmarks_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_bookmarks_post
    FOREIGN KEY (post_id) REFERENCES workout_posts(post_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Shares: optional tracking for social share buttons.
CREATE TABLE shares (
  share_id INT NOT NULL AUTO_INCREMENT,
  user_id INT,
  post_id INT NOT NULL,
  platform VARCHAR(50),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (share_id),
  CONSTRAINT fk_shares_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL,
  CONSTRAINT fk_shares_post
    FOREIGN KEY (post_id) REFERENCES workout_posts(post_id)
    ON DELETE CASCADE,
  INDEX idx_shares_post (post_id),
  INDEX idx_shares_user (user_id)
) ENGINE=InnoDB;
