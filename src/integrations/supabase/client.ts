// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://yticeokzsdysrqdpgeri.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aWNlb2t6c2R5c3JxZHBnZXJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDQxNDQsImV4cCI6MjA1NjgyMDE0NH0.Dx4VuT-RSKcE3JrHoYTLtmD8nKEsbjryao8jNnMTCRU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);