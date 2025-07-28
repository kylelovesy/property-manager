-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('power', 'primary', 'secondary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  price FLOAT NOT NULL,
  description TEXT CHECK (length(description) <= 1000),
  location TEXT NOT NULL CHECK (length(location) <= 100),
  bedrooms INTEGER NOT NULL,
  date_on_sale DATE,
  estate_agent TEXT CHECK (length(estate_agent) <= 100),
  reduced BOOLEAN DEFAULT false,
  views BOOLEAN DEFAULT false,
  gardens BOOLEAN DEFAULT false,
  outbuildings BOOLEAN DEFAULT false,
  condition TEXT CHECK (length(condition) <= 50),
  features JSONB,
  added_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User_Priorities table
CREATE TABLE user_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL CHECK (length(name) <= 50),
  weight INTEGER NOT NULL CHECK (weight BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User_Ratings table
CREATE TABLE user_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL CHECK (length(name) <= 50),
  category TEXT NOT NULL CHECK (category IN ('must_have', 'nice_to_have', 'would_like', 'not_important')),
  points INTEGER NOT NULL GENERATED ALWAYS AS (
    CASE category
      WHEN 'must_have' THEN 10
      WHEN 'nice_to_have' THEN 5
      WHEN 'would_like' THEN 2
      ELSE 0
    END
  ) STORED
);

-- User_Property_Ratings table
CREATE TABLE user_property_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  rating_id UUID NOT NULL REFERENCES user_ratings(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User_Feedback table
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  vote TEXT CHECK (vote IN ('up', 'down')),
  notes TEXT CHECK (length(notes) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

-- Property_Features table
CREATE TABLE property_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  features JSONB NOT NULL,
  added_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Property_Scores table
CREATE TABLE property_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  combined_score FLOAT NOT NULL CHECK (combined_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_properties_url ON properties(url);
CREATE INDEX idx_properties_added_by ON properties(added_by);
CREATE INDEX idx_user_priorities_user_id ON user_priorities(user_id);
CREATE INDEX idx_user_ratings_user_id ON user_ratings(user_id);
CREATE INDEX idx_user_property_ratings_user_property ON user_property_ratings(user_id, property_id);
CREATE INDEX idx_user_feedback_user_property ON user_feedback(user_id, property_id);
CREATE INDEX idx_property_features_property_id ON property_features(property_id);
CREATE INDEX idx_property_scores_property_id ON property_scores(property_id);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_access ON users FOR SELECT USING (auth.uid() = id OR auth.role() = 'power');

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY all_read ON properties FOR SELECT USING (true);
CREATE POLICY primary_delete ON properties FOR DELETE USING (auth.role() = 'primary');

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY all_read_feedback ON user_feedback FOR SELECT USING (true);
CREATE POLICY own_feedback ON user_feedback FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY own_feedback_delete ON user_feedback FOR DELETE USING (auth.uid() = user_id);