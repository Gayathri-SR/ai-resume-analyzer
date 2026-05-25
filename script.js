const analyzeButton = document.querySelector('.analyze-btn');
analyzeButton.addEventListener("click", function() {
    const leftPanel = this.closest('.left-panel');
    const resumeContent = leftPanel.querySelector('.resume-text').value;
    const jdContent = leftPanel.querySelector('.JD-text').value;
    console.log("Resume content : " + resumeContent);
    console.log("JD content : " + jdContent);
});