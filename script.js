const analyzeButton = document.querySelector('.analyze-btn');
analyzeButton.addEventListener("click", async function() {
    const leftPanel = this.closest('.left-panel');

    //temporarily populating resume and JD fields
    const resume = leftPanel.querySelector('.resume-text');
    const jd = leftPanel.querySelector('.JD-text');
    resume.value = "Summary: Seasoned data science leader with 10+ years delivering ML products, managing cross-functional teams, and generating $10M+ business value across finance, healthcare, and tech.\nExperience: Spearheaded the design and launch of a proprietary demand forecasting platform used by Fortune 500 retailers.\nLaunched a demand-forecasting platform adopted by Fortune 500 retailers, increasing forecast accuracy by 15%.\nCollaborated with product, engineering, and marketing to align data initiatives with business goals."
    jd.value = "Role: Senior Data Scientist Industry: Finance & Healthcare Tech Key.\nRequirements: 10+ years of experience delivering ML products.Expertise in demand forecasting and proprietary platform design.Experience managing cross-functional teams.Strong background in finance and healthcare sectors.Proven track record of generating significant business value (e.g., $10M+). "

    const resumeContent = resume.value;
    const jdContent = jd.value;

    if(!resumeContent || !jdContent) {
        alert("Please fill both fields!");
        return;
    }

    const result = await analyzeResume(resumeContent, jdContent);
    const aiText = JSON.parse(result.candidates[0].content.parts[0].text);
    console.log(aiText);

    populateScoreChartCard(aiText);
    populateAnalysisGrid(aiText);
});

async function analyzeResume(resume, jd) {
    const apiKey = API_KEY;

    const prompt = ` Analyze this resume against the job description.
        Return ONLY valid JSON.
        For the scores:
        - skillsScore = match of technical and soft skills
        - experienceScore = relevance and years of experience
        - keywordScore = presence of important JD keywords
        - educationScore = education alignment
        For the matchedSkills = list of skills that matched
        For the matchedKeywords = list of keywords that matched

        The overall matchScore should be based on these factors.
        {
        "matchScore": 0,
        "skillsScore": 0,
        "experienceScore": 0,
        "keywordScore": 0,
        "educationScore": 0,
        "strengths": [],
        "missingSkills": [],
        "matchedSkills": [],
        "matchedKeywords": [],
        "suggestions": []
        }
        Resume : ${resume}
        Job description : ${jd}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        }
    );
    const data = await response.json();
    console.log(data);
    return data;
}

function getMatchStatus(score) {
    if (score >= 85) {
        return {
            status: "Excellent Match",
            description: "Your resume aligns very closely with the job requirements.",
            pillClass: "excellent"
        };
    }

    if (score >= 70) {
        return {
            status: "Strong Match",
            description: "Your resume shows strong alignment with the job requirements.",
            pillClass: "strong"
        };
    }

    if (score >= 50) {
        return {
            status: "Moderate Match",
            description: "Your resume meets several requirements but has some gaps.",
            pillClass: "moderate"
        };
    }

    return {
        status: "Weak Match",
        description: "Your resume may need significant improvements for this role.",
        pillClass: "weak"
    };
}

function populateScoreChartCard(aiText) {
    const matchScore = aiText.matchScore;
    const matchdetailsBreakdownCard = document.querySelector('.right-panel .match-details-breakdown');

    const scoreChart = matchdetailsBreakdownCard.querySelector('.score-chart');
    scoreChart.textContent = matchScore;

    const matchHeader = matchdetailsBreakdownCard.querySelector('.match-header');
    const matchDescription = matchdetailsBreakdownCard.querySelector('.match-description');
    const matchStatus = matchdetailsBreakdownCard.querySelector('.match-status');
    const matchDetails = getMatchStatus(matchScore);
    matchHeader.textContent = matchDetails.status;
    matchDescription.textContent = matchDetails.description;
    matchStatus.textContent = matchDetails.status;
    matchStatus.classList.add(matchDetails.pillClass);

    const matchBreakdown = matchdetailsBreakdownCard.querySelector('.match-breakdown');
    const skills = matchBreakdown.querySelector('.skills-match .bar-chart');
    skills.textContent = aiText.skillsScore;
    const experience = matchBreakdown.querySelector('.experience-match .bar-chart');
    experience.textContent = aiText.experienceScore;
    const keywords = matchBreakdown.querySelector('.keywords-match .bar-chart');
    keywords.textContent = aiText.keywordScore;
    const education = matchBreakdown.querySelector('.education-match .bar-chart');
    education.textContent = aiText.educationScore;
}

function populateAnalysisGrid(aiText) {
    const analysisGrid = document.querySelector('.right-panel .analysis-grid');

    const strengths = analysisGrid.querySelector('.strengths-data');
    strengths.innerHTML = "";
    aiText.strengths.forEach(skill => {
        strengths.innerHTML += `<li>${skill}</li>`;
    });

    const missingSkills = analysisGrid.querySelector('.missing-skills-data');
    missingSkills.innerHTML = "";
    aiText.missingSkills.forEach(skill => {
        missingSkills.innerHTML += `<li>${skill}</li>`;
    });

    const matchedSkills = analysisGrid.querySelector('.matched-skills-data');
    matchedSkills.innerHTML = "";
    aiText.matchedSkills.forEach(skill => {
        matchedSkills.innerHTML += `<div class="pill">${skill}</div>`
    });

    const matchedKeywords = analysisGrid.querySelector('.matched-keywords-data');
    matchedKeywords.innerHTML = "";
    aiText.matchedKeywords.forEach(keyword => {
        matchedKeywords.innerHTML += `<div class="pill">${keyword}</div>`;
    });

    const suggestions = analysisGrid.querySelector('.suggestions-data');
    suggestions.innerHTML = "";
    aiText.suggestions.forEach(suggestion => {
        suggestions.innerHTML += `<li>${suggestion}</li>`;
    });
}