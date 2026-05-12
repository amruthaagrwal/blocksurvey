// scripts/config.js

// IMPORTANT: Replace these with your actual Supabase project URL and Anon Key
// Since this is a static site (GitHub Pages), the Anon Key is public.
// Security must be enforced via Row Level Security (RLS) policies in Supabase.

export const config = {
    SUPABASE_URL: 'https://evaqrvsbyuuqzioaivno.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YXFydnNieXV1cXppb2Fpdm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NTM4ODYsImV4cCI6MjA5NDEyOTg4Nn0.5Vb3goDfN-x8IUXhCcYb3xd-bBJbr8CowuJnOWPwzTY',
    
    // Application settings
    SAVE_INTERVAL_MS: 10000, // Autosave every 10 seconds
    SURVEY_VERSION: '1.0.0',
    MAX_QUESTIONS: 110
};
