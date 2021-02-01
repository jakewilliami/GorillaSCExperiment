import gorilla = require('gorilla/gorilla');
import utils = require('utils');

const nImagesInGrid: number = 25;
const stimConditions: string[] = ['D', 'C', 'F', 'HF', 'LF'];

gorilla.ready(function(){
    // The following two lines are just from an example script
    // https://gorilla.sc/admin/task/19942/editor
    // $('.force-fullsize').remove();
    // $('body').append('<div id="frame" style="z-index:99"></div>');
    
    // Construct 24 random distractor urls
    const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid - 1);
    var randomURLs: string[] = [];
    for (var i = 0; i < randomDistractors.length; i++) {
        const distractorURL: string = gorilla.stimuliURL(randomDistractors[i]);
        randomURLs.push(distractorURL);
    }
    
    // add random condition url to a random place in the array
    const randomCondition: string = utils.randVal(stimConditions)
    const randomConditionImage: string = utils.constructRandImageName(randomCondition);
    const randomConditionImageURL: string = gorilla.stimuliURL(randomConditionImage);
    utils.insert(randomURLs, utils.randInt(0, nImagesInGrid - 1), randomConditionImageURL);
    
	// Build our screen
    $('#gorilla').hide();
    
	gorilla.populateAndLoad($('#gorilla'), 'exp', { distractors: randomURLs }, (err) => {
	    $('#gorilla').show();
	     
	    $('#exit-button').on('click', ()=>{
		    gorilla.metric({
			    event: 'Button clicked!'
		    });

		    gorilla.finish();
	        })
	    })
})
