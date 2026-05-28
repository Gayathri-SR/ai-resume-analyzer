const analyzeButton = document.querySelector('.analyze-btn');
analyzeButton.addEventListener("click", async function() {
    const leftPanel = this.closest('.left-panel');
    const resumeContent = leftPanel.querySelector('.resume-text').value;
    const jdContent = leftPanel.querySelector('.JD-text').value;

    if(!resumeContent || !jdContent) {
        alert("Please fill both fields!");
        return;
    }

    const result = await analyzeResume(resumeContent, jdContent);
    console.log(result);
});

async function analyzeResume(resume, jd) {
    const apiKey = "AIzaSyA4820vN_AVwJdXqF5tftEMTs3YGZZmJTc"; //temporary exposure for learning

    const prompt = ` Analyze this resume against the job description. Return :
        1. Match score
        2. Strengths
        3. Missing skills
        4. Suggestions
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