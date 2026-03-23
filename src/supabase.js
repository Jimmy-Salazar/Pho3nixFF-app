/*import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rmolvzjluxutxmxzthjp.supabase.co'
const supabaseKey = 'sb_publishable_MTWCG8wMiYMIu8yJ_TGvwA_RpFFOixl'

export const supabase = createClient(supabaseUrl, supabaseKey)*/


import { createClient } from "@supabase/supabase-js"

const supabaseUrl = 'https://rmolvzjluxutxmxzthjp.supabase.co'
const supabaseKey = 'sb_publishable_MTWCG8wMiYMIu8yJ_TGvwA_RpFFOixl'

export const supabase = createClient(supabaseUrl, supabaseKey)

if (typeof window !== "undefined") {
  window.supabase = supabase
}