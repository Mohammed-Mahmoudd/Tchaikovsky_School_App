import 'react-native-url-polyfill/auto';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cgzypavgkpiklnzvjoxt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnenlwYXZna3Bpa2xuenZqb3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjA1NTgsImV4cCI6MjA2NzczNjU1OH0.okPQKEt1HSK8fxeOTgW7Iv6Qv96gayvOAVo1x9vRDdY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
