// scripts/supabase-client.js
import { config } from './config.js';

// The global supabase object will be available because we load the CDN script in HTML
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

let supabaseInstance = null;

export function getSupabase() {
    if (!supabaseInstance) {
        if (!window.supabase) {
            console.error("Supabase library not loaded. Make sure the CDN script is included.");
            return null;
        }
        
        // If config is not set, we can't initialize
        if (config.SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE') {
            console.warn("Supabase URL and Key are not configured. Working in local mode only.");
            return null;
        }
        
        supabaseInstance = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    }
    return supabaseInstance;
}

export async function submitSurvey(data) {
    const sb = getSupabase();
    if (!sb) {
        // Return a mock success for testing without backend
        return { success: true, data: { id: "mock-id-123" }, error: null };
    }

    try {
        // Generate UUID client-side to avoid needing SELECT after INSERT
        const respondentId = crypto.randomUUID();

        // 1. Insert Respondent
        const { error: respondentError } = await sb
            .from('respondents')
            .insert([{ id: respondentId, ...data.respondent }]);

        if (respondentError) throw respondentError;

        // 2. Insert Responses
        const responsesToInsert = data.responses.map(r => ({
            respondent_id: respondentId,
            question_number: r.question_number,
            answer: r.answer
        }));

        const { error: responsesError } = await sb
            .from('responses')
            .insert(responsesToInsert);

        if (responsesError) throw responsesError;

        // 3. Insert Dimension Scores
        const scoresToInsert = data.dimensionScores.map(d => ({
            respondent_id: respondentId,
            dimension_name: d.dimension_name,
            score: d.score,
            interpretation: d.interpretation
        }));

        const { error: scoresError } = await sb
            .from('dimension_scores')
            .insert(scoresToInsert);

        if (scoresError) throw scoresError;

        return { success: true, data: { id: respondentId }, error: null };

    } catch (error) {
        console.error("Error submitting survey:", error);
        return { success: false, data: null, error };
    }
}

export async function checkEmployeeIdExists(employeeId) {
    const sb = getSupabase();
    if (!sb) return false; // Mock

    try {
        const { data, error } = await sb
            .from('respondents')
            .select('employee_id')
            .eq('employee_id', employeeId)
            .limit(1);

        if (error) throw error;
        return data.length > 0;
    } catch (error) {
        console.error("Error checking employee ID:", error);
        return false;
    }
}

// Admin Auth functions
export async function adminLogin(email, password) {
    const sb = getSupabase();
    if (!sb) return { error: { message: "Supabase not configured." } };

    return await sb.auth.signInWithPassword({ email, password });
}

export async function adminLogout() {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
}

export async function getSession() {
    const sb = getSupabase();
    if (!sb) return null;
    
    const { data, error } = await sb.auth.getSession();
    return error ? null : data.session;
}
