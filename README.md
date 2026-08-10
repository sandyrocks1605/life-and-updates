# Life And Updates — Version 2

This version adds:
- Login / logout
- Student vs Editor permissions
- Editor-only dashboard
- Upload notes
- Search notes
- Delete notes
- Mathematics, Science, Social Science, English, Hindi, Marathi, C.Marathi, Sanskrit, Computer and Other
- Team page
- Yellow/black responsive design

## Why Supabase?
A normal HTML file cannot securely store passwords or decide who is allowed to edit. This project uses Supabase Authentication, PostgreSQL and Storage.

## Setup

1. Create a free Supabase project at https://supabase.com/
2. Open SQL Editor and run `supabase_schema.sql`.
3. In Storage, create a bucket called `notes`.
4. If using direct links, make the `notes` bucket public. Keep uploads/deletes restricted by the storage policies in the SQL.
5. Open `config.js` and replace:
   PASTE_YOUR_SUPABASE_PROJECT_URL_HERE
   PASTE_YOUR_SUPABASE_ANON_KEY_HERE
   with the Project URL and public anon key from Supabase Project Settings > API.
6. Open `signup.html` and create your first account. New accounts are automatically created as `student`.
7. In Supabase SQL Editor, promote the account you want to manage notes with:
   update public.profiles set role='editor' where email='your@email.com';
8. Other accounts remain `student` unless you explicitly promote them.
9. Host all files together. `index.html` is the homepage.

## Connected project
The included `config.js` is already configured for the Supabase project supplied for this site.

## Security
The included key is a browser-safe Supabase publishable/anon key. Do NOT replace it with a Supabase service_role key or any secret key. The database and storage Row Level Security policies are what prevent students from editing notes.

## Files
- index.html — homepage, subjects, notes, updates, team
- login.html — login
- signup.html — account creation
- dashboard.html — editor-only upload/delete dashboard
- styles.css — design
- config.js — Supabase public configuration
- app.js — authentication, notes and dashboard logic
- supabase_schema.sql — database/RLS setup
