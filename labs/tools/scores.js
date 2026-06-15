// fill in exercise scores
window.onload = function () {
    document.querySelectorAll('.exercise-score').forEach(function (score) {
        // no score yet
        score.replaceChildren();

        // find where exercise answers are stored in localStorage
        let id = score.getAttribute('id');
        if (!id) return;
        if (id.endsWith('_score')) id = id.slice(0,-6);
        id = document.querySelector('#'+id);
        if (!id) return;
        id = id.getAttribute('href');
        if (!id) return;

        // get saved answers for this exercise
        let saved_answers = localStorage.getItem('/ComputationStructures/' + id)
        if (!saved_answers) return;
        saved_answers = JSON.parse(saved_answers);

        // show score if we can compute one
        let ncorrect = 0;
        let nanswers = 0;
        for (const [aid,a] of Object.entries(saved_answers)) {
            if (aid[0] === '_') continue;
            console.log(id,aid,a);
            nanswers += 1;
            if (a.check === 'right') ncorrect += 1;
        }
        if (nanswers > 0) {
            score.innerHTML = `[exercises: ${ncorrect}/${nanswers}]`;
        }
    });
};
