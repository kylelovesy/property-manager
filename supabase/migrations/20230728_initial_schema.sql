

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."properties" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "url" "text" NOT NULL,
    "added_by" "uuid",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."properties" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_features" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "property_id" "uuid",
    "added_by" "uuid",
    "feature" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."property_features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."property_scores" (
    "property_id" "uuid" NOT NULL,
    "combined_score" numeric,
    CONSTRAINT "property_scores_combined_score_check" CHECK ((("combined_score" >= (0)::numeric) AND ("combined_score" <= (100)::numeric)))
);


ALTER TABLE "public"."property_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feedback" (
    "property_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vote" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_feedback_vote_check" CHECK (("vote" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."user_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_priorities" (
    "user_id" "uuid" NOT NULL,
    "priority" "text" NOT NULL
);


ALTER TABLE "public"."user_priorities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_property_ratings" (
    "property_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "score" integer,
    CONSTRAINT "user_property_ratings_score_check" CHECK ((("score" >= 0) AND ("score" <= 5)))
);


ALTER TABLE "public"."user_property_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_ratings" (
    "user_id" "uuid" NOT NULL,
    "rating_type" "text" NOT NULL,
    "value" integer
);


ALTER TABLE "public"."user_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['primary'::"text", 'secondary'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE "public"."properties" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."property_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_priorities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_property_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_ratings" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."properties" TO "anon";
GRANT ALL ON TABLE "public"."properties" TO "authenticated";
GRANT ALL ON TABLE "public"."properties" TO "service_role";



GRANT ALL ON TABLE "public"."property_features" TO "anon";
GRANT ALL ON TABLE "public"."property_features" TO "authenticated";
GRANT ALL ON TABLE "public"."property_features" TO "service_role";



GRANT ALL ON TABLE "public"."property_scores" TO "anon";
GRANT ALL ON TABLE "public"."property_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."property_scores" TO "service_role";



GRANT ALL ON TABLE "public"."user_feedback" TO "anon";
GRANT ALL ON TABLE "public"."user_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."user_priorities" TO "anon";
GRANT ALL ON TABLE "public"."user_priorities" TO "authenticated";
GRANT ALL ON TABLE "public"."user_priorities" TO "service_role";



GRANT ALL ON TABLE "public"."user_property_ratings" TO "anon";
GRANT ALL ON TABLE "public"."user_property_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_property_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."user_ratings" TO "anon";
GRANT ALL ON TABLE "public"."user_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
