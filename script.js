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

    try {
        this.disabled = true;
        this.textContent = "Analyzing...";
        showLoader();

        const result = await analyzeResume(resumeContent, jdContent);
        if (result.error) {
            alert(result.error.message);
            return;
        }

        const rawResponse = result?.candidates[0]?.content?.parts[0]?.text;
        if (!rawResponse) {
            throw new Error("No valid response received from AI.");
        }
        
        const cleanedResponse = rawResponse.replace(/```json/g, '')
                                            .replace(/```/g, '')
                                            .trim();
        const aiText = JSON.parse(cleanedResponse);

        if (!aiText.isValid) {
            alert(aiText.errorMessage);
            return;
        }
        console.log(aiText);

        populateScoreChartCard(aiText);
        populateAnalysisGrid(aiText);
        showAnalysisResults();
    }
    catch(error) {
        console.error(error);
        alert("Unable to process AI response.");
    }
    finally {
        this.disabled = false;
        this.textContent = "Analyze Resume";
        hideLoader();
    }
});

function showLoader() {
    document.querySelector(".loader").style.display = "flex";
}

function hideLoader() {
    document.querySelector(".loader").style.display = "none";
}

function showAnalysisResults() {
    const emptyState = document.querySelector('.empty-state');
    const analysisContent = document.querySelector('.match-details-breakdown');

    emptyState.classList.add('hidden');
    analysisContent.classList.remove('hidden');
}

async function analyzeResume(resume, jd) {
    const apiKey = API_KEY;

    const prompt = ` Analyze this resume against the job description.
        If either the resume or job description appears invalid,
        incomplete, random text, or does not resemble a professional
        resume/job description, return:

        {
        "isValid": false,
        "errorMessage": "Invalid resume or job description provided."
        }

        Otherwise:

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
        "isValid": true,
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response:", data);

    if (!response.ok) {
        throw new Error(data?.error?.message || `HTTP ${response.status}`);
    }
    console.log(data);
    return data;
}

function populateScoreChartDiagram(aiText) {
    const scoreChart = document.querySelector('.score-chart');
    const scoreValue = scoreChart.querySelector('.score-value');

    scoreChart.style.setProperty('--score', aiText.matchScore);
    scoreValue.textContent = `${aiText.matchScore}%`;
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

    populateScoreChartDiagram(aiText);

    const matchHeader = matchdetailsBreakdownCard.querySelector('.match-header');
    const matchDescription = matchdetailsBreakdownCard.querySelector('.match-description');
    const matchStatus = matchdetailsBreakdownCard.querySelector('.match-status');
    const matchDetails = getMatchStatus(matchScore);
    matchHeader.textContent = matchDetails.status;
    matchDescription.textContent = matchDetails.description;
    matchStatus.textContent = matchDetails.status;
    matchStatus.classList.remove(
        'excellent',
        'strong',
        'moderate',
        'weak'
    );
    matchStatus.classList.add(matchDetails.pillClass);

    const matchBreakdown = matchdetailsBreakdownCard.querySelector('.match-breakdown');

    const skills = matchBreakdown.querySelector('.skills-match .bar-fill');
    skills.style.width = `${aiText.skillsScore}%`;
    matchBreakdown.querySelector('.skills-match .score').textContent = `${aiText.skillsScore}%`;

    const experience = matchBreakdown.querySelector('.experience-match .bar-fill');
    experience.style.width = `${aiText.experienceScore}%`;
    matchBreakdown.querySelector('.experience-match .score').textContent = `${aiText.experienceScore}%`;

    const keywords = matchBreakdown.querySelector('.keywords-match .bar-fill');
    keywords.style.width = `${aiText.keywordScore}%`;
    matchBreakdown.querySelector('.keywords-match .score').textContent = `${aiText.keywordScore}%`;

    const education = matchBreakdown.querySelector('.education-match .bar-fill');
    education.style.width = `${aiText.educationScore}%`;
    matchBreakdown.querySelector('.education-match .score').textContent = `${aiText.educationScore}%`;
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