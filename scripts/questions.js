// scripts/questions.js

export const dimensions = {
    A: { name: "Self-Management", questions: [1,12,23,34,45,56,67,78,89,100] },
    B: { name: "Personal Values", questions: [2,13,24,35,46,57,68,79,90,101] },
    C: { name: "Personal Goals", questions: [3,14,25,36,47,58,69,80,91,102] },
    D: { name: "Personal Development", questions: [4,15,26,37,48,59,70,81,92,103] },
    E: { name: "Problem Solving", questions: [5,16,27,38,49,60,71,82,93,104] },
    F: { name: "Creativity", questions: [6,17,28,39,50,61,72,83,94,105] },
    G: { name: "Influence", questions: [7,18,29,40,51,62,73,84,95,106] },
    H: { name: "Managerial Insight", questions: [8,19,30,41,52,63,74,85,96,107] },
    I: { name: "Supervisory Skills", questions: [9,20,31,42,53,64,75,86,97,108] },
    J: { name: "Trainer Capability", questions: [10,21,32,43,54,65,76,87,98,109] },
    K: { name: "Team Building", questions: [11,22,33,44,55,66,77,88,99,110] }
};

export const recommendations = {
    A: {
        low: ["Develop a daily routine to manage stress better.", "Set clear boundaries between work and personal life.", "Practice mindfulness or relaxation techniques regularly."],
        moderate: ["Continue refining your time management skills.", "Look for ways to optimize your daily energy levels."],
        high: ["Great job maintaining balance! Continue your current self-management practices and share tips with colleagues."]
    },
    B: {
        low: ["Reflect on what truly matters to you in your career.", "Align your daily tasks with your core personal values.", "Do not compromise on important principles for short-term gains."],
        moderate: ["You have a fair understanding of your values; try to assert them more in decision-making."],
        high: ["Excellent alignment of your actions with your personal values. Keep leading by example."]
    },
    C: {
        low: ["Set SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goals.", "Write down your long-term ambitions and review them weekly.", "Break large goals into smaller, manageable steps."],
        moderate: ["Ensure your personal goals are well-integrated with your work objectives."],
        high: ["Your goal-setting process is strong. Focus on mentoring others to achieve their goals."]
    },
    D: {
        low: ["Dedicate at least 2 hours a week to learning a new skill.", "Seek constructive feedback from peers and mentors actively.", "Attend workshops or enroll in online courses relevant to your field."],
        moderate: ["Continue seeking out new experiences and reflecting on what you've learned."],
        high: ["Outstanding commitment to growth. Consider taking on stretch assignments to challenge yourself further."]
    },
    E: {
        low: ["Adopt a systematic approach: identify, analyze, propose, implement, evaluate.", "Don't rush to the first solution; brainstorm multiple alternatives.", "Use data and facts to support your problem-solving process."],
        moderate: ["You solve problems well; try to tackle more complex, cross-functional issues."],
        high: ["Strong problem-solving capability. You are likely a go-to person for difficult issues."]
    },
    F: {
        low: ["Encourage brainstorming sessions without immediate judgment.", "Explore unconventional approaches and take calculated risks.", "Expose yourself to ideas outside your immediate industry."],
        moderate: ["You are open to new ideas; try to initiate more innovative projects."],
        high: ["Highly creative! Keep fostering a culture of innovation within your team."]
    },
    G: {
        low: ["Work on building rapport before trying to influence others.", "Tailor your communication style to your audience.", "Build confidence in public speaking and presenting ideas."],
        moderate: ["You influence well in familiar settings; practice in more challenging or resistant environments."],
        high: ["Strong influencer. Use your skills to advocate for positive organizational changes."]
    },
    H: {
        low: ["Study different management styles and when to apply them.", "Seek to understand the underlying motivations of your team.", "Ask for feedback on your management approach."],
        moderate: ["You understand management principles well; focus on adapting them to unique situations."],
        high: ["Deep managerial insight. Consider writing or sharing your philosophies internally."]
    },
    I: {
        low: ["Delegate smaller tasks first to build trust.", "Create clear accountability structures and follow up regularly.", "Ensure your subordinates clearly understand their objectives."],
        moderate: ["Good supervisory skills; focus on proactive performance management rather than reactive."],
        high: ["Excellent supervisor. You effectively maximize your team's contribution."]
    },
    J: {
        low: ["Set aside specific time for reviewing team developmental needs.", "Learn coaching techniques rather than just giving answers.", "Provide constructive, specific, and timely feedback."],
        moderate: ["You train well; try to build a more formalized mentorship program."],
        high: ["Exceptional capability in developing others. You are a true multiplier of talent."]
    },
    K: {
        low: ["Organize regular team-building activities, both formal and informal.", "Work to build an open and trusting climate within the group.", "Address team conflicts quickly and constructively."],
        moderate: ["Your team functions well; focus on improving cross-team collaboration."],
        high: ["Masterful team builder. Your team likely operates with high synergy and trust."]
    }
};

export const questions = [
    { id: 1, text: "I cope well with pressures inherent in my job." },
    { id: 2, text: "My stand on important issues of principle is clear to me." },
    { id: 3, text: "When important decisions of my life must be made, I act decisively." },
    { id: 4, text: "I put considerable effort into developing myself." },
    { id: 5, text: "I am able to resolve problems effectively." },
    { id: 6, text: "I often experiment and try new ideas." },
    { id: 7, text: "My views are usually taken into account by my colleagues and I often affect their decision making." },
    { id: 8, text: "I understand the principles that underlie my approach to managing." },
    { id: 9, text: "I find little difficulty in ensuring that my subordinates perform effectively." },
    { id: 10, text: "I consider myself to be a good trainer of my subordinates." },
    { id: 11, text: "I chair or lead meetings well." },
    { id: 12, text: "I take care of my physical health." },
    { id: 13, text: "I sometimes ask other people to comment on my basic approach to life and work." },
    { id: 14, text: "If asked I would be able to describe what I want to do with my life." },
    { id: 15, text: "I have considerable potential for further learning and development." },
    { id: 16, text: "My approach to problem solving is systematic." },
    { id: 17, text: "You could describe me as a person who enjoys change." },
    { id: 18, text: "I usually influence other people successfully." },
    { id: 19, text: "I believe my management style is appropriate." },
    { id: 20, text: "I have full support of my subordinates." },
    { id: 21, text: "I put considerable energy into the training and development of my subordinates." },
    { id: 22, text: "I believe that techniques for developing effective groups are important to my effectiveness." },
    { id: 23, text: "I prepare to be unpopular when necessary." },
    { id: 24, text: "I rarely take the easy option rather than doing that which I know to be right." },
    { id: 25, text: "My work and personal goal are largely complementary." },
    { id: 26, text: "My work life is often exciting." },
    { id: 27, text: "I regularly review my work objectives." },
    { id: 28, text: "It seems to me that many other people are less creative than I am." },
    { id: 29, text: "I usually make a good first impression." },
    { id: 30, text: "I initiate discussion and seek feedback concerning my subordinates." },
    { id: 31, text: "I am good at building positive relationships with my subordinates." },
    { id: 32, text: "I set sufficient time aside to review the developmental needs of my subordinates." },
    { id: 33, text: "I understand the principles underlying effective team development." },
    { id: 34, text: "I manage time effectively." },
    { id: 35, text: "I frequently stand firm on matters of principle." },
    { id: 36, text: "Whenever possible I try to measure my achievements objectively." },
    { id: 37, text: "I often seek out new experiences." },
    { id: 38, text: "I handle complex information with competence and clarity." },
    { id: 39, text: "I am prepared to go through a period of uncertainty in order to try a new idea." },
    { id: 40, text: "I would describe myself as assertive." },
    { id: 41, text: "I believe it is possible to change the attitudes people have towards their work." },
    { id: 42, text: "My subordinates make a maximum contribution to the organization." },
    { id: 43, text: "I regularly appraise the performance of my subordinates." },
    { id: 44, text: "I work to build open and trusting climates in work groups." },
    { id: 45, text: "My private life is not adversely affected by my job." },
    { id: 46, text: "I rarely behave in ways contrary to my beliefs." },
    { id: 47, text: "My job makes an important contribution to my performance or ability." },
    { id: 48, text: "I regularly seek feedback from others about my enjoyment of life." },
    { id: 49, text: "I am a good planner." },
    { id: 50, text: "I do not loose heart and give up when solutions cannot be found readily." },
    { id: 51, text: "It is relatively easy for me to create rapport with others." },
    { id: 52, text: "I understand what motivates people to high performance." },
    { id: 53, text: "I delegate responsibility effectively." },
    { id: 54, text: "I am able and willing to give personal feedback to my colleagues and subordinates." },
    { id: 55, text: "Relationships between the work team I lead and other teams in the organization are healthy and co-operative." },
    { id: 56, text: "I rarely allow my work to exhaust me." },
    { id: 57, text: "I fundamentally question my values from time to time." },
    { id: 58, text: "A sense of achievement is important to me." },
    { id: 59, text: "I enjoy challenge." },
    { id: 60, text: "I review my progress and performance regularly." },
    { id: 61, text: "I am self-confident." },
    { id: 62, text: "I can generally influence the behavior of others." },
    { id: 63, text: "When it comes to managing people, I question the older established ideas." },
    { id: 64, text: "I reward the effective performance of my subordinates." },
    { id: 65, text: "I believe it is an essential part of manager's job to counsel subordinates." },
    { id: 66, text: "I believe managers need not be leaders of their teams on all occasions." },
    { id: 67, text: "I balance my eating and drinking in the best interest of my health." },
    { id: 68, text: "I usually do what I believe in." },
    { id: 69, text: "I have a good understanding with my colleagues at work." },
    { id: 70, text: "I often think about what is preventing me from becoming more effective and act on my conclusions." },
    { id: 71, text: "I consciously use other people to help me solve problems." },
    { id: 72, text: "I can manage highly innovative people." },
    { id: 73, text: "I usually perform well at meetings." },
    { id: 74, text: "I manage in different ways to motivate the people of my team." },
    { id: 75, text: "I rarely have real difficulty in dealing with my subordinates." },
    { id: 76, text: "I do not allow opportunities for the development of my subordinates to pass off." },
    { id: 77, text: "I ensure that people I manage clearly understand the objectives of our group." },
    { id: 78, text: "I generally feel energetic and lively." },
    { id: 79, text: "I have explored how my upbringing has affected my beliefs." },
    { id: 80, text: "I have an identifiable personal career plan." },
    { id: 81, text: "I refuse to give up when things are not going well." },
    { id: 82, text: "I feel confident about leading group problem-solving sessions." },
    { id: 83, text: "Generating ideas is not a problem for me." },
    { id: 84, text: "I practice what I preach." },
    { id: 85, text: "I believe subordinates should question management decisions." },
    { id: 86, text: "I put sufficient effort into defining the role and objectives of my subordinates." },
    { id: 87, text: "My subordinates are developing the skills that they need." },
    { id: 88, text: "I have the skills required to build an effective work team." },
    { id: 89, text: "My friends would say that I look after my own well being." },
    { id: 90, text: "I am willing to discuss my personal beliefs with others." },
    { id: 91, text: "I discuss my long-term aims with others." },
    { id: 92, text: "I could be accurately described as open and flexible." },
    { id: 93, text: "In general, I adopt a methodical approach to problem solving." },
    { id: 94, text: "When I make an error, I put the matter right without becoming upset." },
    { id: 95, text: "I am a good listener." },
    { id: 96, text: "I effectively delegate work to others." },
    { id: 97, text: "If I were in a tight spot, I am confident that I would receive full support from those I manage." },
    { id: 98, text: "I am good at counseling others." },
    { id: 99, text: "I constantly try to improve the contribution of my subordinates." },
    { id: 100, text: "I find ways to resolve my emotional difficulties." },
    { id: 101, text: "I have compared my values with those of the organizations." },
    { id: 102, text: "I usually achieve my personal ambitions." },
    { id: 103, text: "I continue to develop and stretch myself." },
    { id: 104, text: "I do not have bigger problems than I had a year ago." },
    { id: 105, text: "At times I value unconventional behavior at work." },
    { id: 106, text: "People take my views seriously." },
    { id: 107, text: "I believe the methods I use to manage others are effective." },
    { id: 108, text: "My subordinates have a high respect for me as a manager." },
    { id: 109, text: "I think it is important for someone else to be capable of doing my job." },
    { id: 110, text: "I believe that teams can often achieve much more than individuals working alone." }
];

export function getDimensionForQuestion(questionId) {
    for (const [dimKey, dimData] of Object.entries(dimensions)) {
        if (dimData.questions.includes(questionId)) {
            return { key: dimKey, name: dimData.name };
        }
    }
    return null;
}
