// scripts/scoring.js
import { dimensions, recommendations } from './questions.js';

/**
 * Calculates the score for all dimensions and the total score.
 * @param {Object} answers - Mapping of question_id to answer (0 or 1)
 * @returns {Object} { totalScore, dimensionScores, topStrengths, topBlockages }
 */
const DIMENSION_DATA = {
    A: { desc: "Your ability to manage personal stress and maintain a healthy work-life balance.", strengthMsg: "You have strong resilience and a mature approach to handling professional pressures.", blockageMsg: "Work-life imbalance or stress may be hindering your long-term performance." },
    B: { desc: "The clarity of your principles and your consistency in acting upon them.", strengthMsg: "You are perceived as a person of high integrity with a clear ethical compass.", blockageMsg: "A lack of clear personal values may make your decisions seem inconsistent." },
    C: { desc: "Your decisiveness and how well you have defined your life and career path.", strengthMsg: "You have a clear sense of purpose and act decisively on important life choices.", blockageMsg: "Unclear goals may lead to a feeling of being 'stuck' or drifting professionally." },
    D: { desc: "Your commitment to continuous learning and seeking new growth experiences.", strengthMsg: "You have a vibrant growth mindset and actively invest in your future capability.", blockageMsg: "Stagnation in personal growth can lead to your skills becoming obsolete." },
    E: { desc: "Your systematic approach to identifying and resolving organizational problems.", strengthMsg: "You tackle challenges with a logical, data-driven, and systematic methodology.", blockageMsg: "Reactive problem-solving may lead to recurring issues and inefficiencies." },
    F: { desc: "Your capacity for innovation and your willingness to experiment with new ideas.", strengthMsg: "You are a catalyst for innovation and comfortable with the uncertainty of change.", blockageMsg: "A preference for the 'status quo' may prevent you from finding better ways to work." },
    G: { desc: "Your assertiveness and how effectively you influence the views of others.", strengthMsg: "You command respect and successfully guide others towards your point of view.", blockageMsg: "Difficulty in influencing others can limit your ability to get support for your ideas." },
    H: { desc: "Your understanding of management philosophies and what motivates people.", strengthMsg: "You possess a deep understanding of human motivation and management theory.", blockageMsg: "A lack of managerial insight can lead to using inappropriate leadership styles." },
    I: { desc: "Your skill in delegation, accountability, and day-to-day team supervision.", strengthMsg: "You are an effective supervisor who maximizes the contribution of every team member.", blockageMsg: "Poor supervisory skills often lead to underperformance and lack of accountability." },
    J: { desc: "Your effectiveness in coaching, mentoring, and developing your subordinates.", strengthMsg: "You are a true developer of people, multiplying the talent within your organization.", blockageMsg: "Neglecting the development of others creates a dependency on you and stunts team growth." },
    K: { desc: "Your ability to build high-synergy teams with a trusting climate.", strengthMsg: "You build cohesive teams that achieve more together than they could individually.", blockageMsg: "Low team synergy results in conflict, silos, and missed opportunities." }
};

export function calculateScores(answers) {
    console.log("--- Starting Scoring Calculation ---");
    let totalScore = 0;
    const dimensionScores = [];

    // Calculate score for each dimension (YES = 1 point)
    for (const [key, dimData] of Object.entries(dimensions)) {
        let score = 0;
        dimData.questions.forEach(qId => {
            if (answers[qId] === 1) {
                score += 1;
                totalScore += 1;
            }
        });

        dimensionScores.push({
            dimension_key: key,
            dimension_name: dimData.name,
            score: score,
            percentage: (score / 10) * 100,
            interpretation: score >= 8 ? "Strength" : (score >= 5 ? "Moderate" : "Blockage"),
            description: DIMENSION_DATA[key].desc,
            strengthMsg: DIMENSION_DATA[key].strengthMsg,
            blockageMsg: DIMENSION_DATA[key].blockageMsg
        });
    }

    // Sort by score for ranking (highest to lowest)
    // Tie-break: use the dimension key alphabetically if scores are equal
    const sorted = [...dimensionScores].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.dimension_key.localeCompare(b.dimension_key);
    });

    const topStrengths = sorted.slice(0, 3);
    const topBlockages = sorted.slice().reverse().slice(0, 3);

    console.log("Top Strengths:", topStrengths.map(s => s.dimension_name));
    console.log("Top Blockages:", topBlockages.map(b => b.dimension_name));
    console.log("--- Scoring Complete ---");

    return {
        totalScore,
        dimensionScores,
        topStrengths,
        topBlockages
    };
}

/**
 * Retrieves personalized recommendations for a given dimension and score.
 */
export function getRecommendations(dimensionKey, score) {
    const dimRecs = recommendations[dimensionKey];
    if (!dimRecs) return [];

    if (score >= 8) return dimRecs.high;
    if (score >= 5) return dimRecs.moderate;
    return dimRecs.low;
}

/**
 * Quality Checks (Speed-running, Straight-lining)
 * @param {Object} answers 
 * @param {number} durationSeconds 
 * @returns {string} Quality flag: "Good", "Moderate", "Suspicious"
 */
export function evaluateResponseQuality(answers, durationSeconds) {
    const totalQuestions = Object.keys(answers).length;
    
    // 1. Time check (assuming min 1 second per question is realistically "Moderate" or "Suspicious" if less)
    // 110 questions. If < 110 seconds, it's very suspicious.
    // If < 220 seconds (2s per question), it's moderate.
    let timeFlag = "Good";
    if (durationSeconds < 110) timeFlag = "Suspicious";
    else if (durationSeconds < 220) timeFlag = "Moderate";

    // 2. Straight-lining check
    // If the same answer is given 30 times in a row, suspicious.
    let straightLineCount = 0;
    let maxStraightLine = 0;
    let lastAnswer = null;

    // Must sort keys to ensure chronological order
    const sortedQuestionIds = Object.keys(answers).map(Number).sort((a, b) => a - b);
    
    for (const qId of sortedQuestionIds) {
        const ans = answers[qId];
        if (ans === lastAnswer) {
            straightLineCount++;
            if (straightLineCount > maxStraightLine) {
                maxStraightLine = straightLineCount;
            }
        } else {
            straightLineCount = 1;
            lastAnswer = ans;
        }
    }

    let varianceFlag = "Good";
    if (maxStraightLine > 40) varianceFlag = "Suspicious";
    else if (maxStraightLine > 25) varianceFlag = "Moderate";

    // 3. Patterned Responding check (Alternating Yes/No)
    let patternCount = 0;
    for (let i = 1; i < sortedQuestionIds.length; i++) {
        const current = answers[sortedQuestionIds[i]];
        const previous = answers[sortedQuestionIds[i-1]];
        if (current !== previous) patternCount++;
    }
    
    // If alternating more than 85% of the time, very suspicious
    let patternFlag = "Good";
    const patternRatio = patternCount / totalQuestions;
    if (patternRatio > 0.85) patternFlag = "Suspicious";
    else if (patternRatio > 0.7) patternFlag = "Moderate";

    // Combine flags
    if (timeFlag === "Suspicious" || varianceFlag === "Suspicious" || patternFlag === "Suspicious") return "Suspicious";
    if (timeFlag === "Moderate" || varianceFlag === "Moderate" || patternFlag === "Moderate") return "Moderate";
    return "Good";
}
