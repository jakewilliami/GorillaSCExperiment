import gorilla = require('gorilla/gorilla');
import utils = require('utils');
const nImagesInGrid: number = 25;
var stimConditions: string[] = ['D', 'C', 'F', 'HF', 'LF'];
const fixationLength: number = 500;
gorilla.ready(function(){
    const randomCondition: string = utils.takeRand(stimConditions);
    console.log(randomCondition);
    
    var blockArray = utils.constructBlockArray();
    var trialArray: string[] = [];
    var currentTrial: number = 0;
    
    function loadTrial() {
        // Build our screen
        $('#gorilla').hide();
        
        // gorilla.refreshLayout();
        gorilla.populateAndLoad($('#gorilla'), 'exp', { trials: trialArray }, (err) => {
            $('#gorilla').show();
            
            $('.response-button').on('click', () => {
                const randTrial = utils.takeRand(blockArray);
                    
                if (randTrial % 2 == 0) {
                    // generate a list of 25 random distractors
                    // Construct 25 random distractor urls
                    const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid);
                    var randomDistractorURLs: string[] = [];
                    for (var i = 0; i < randomDistractors.length; i++) {
                        const distractorURL: string = gorilla.stimuliURL(randomDistractors[i]);
                        randomDistractorURLs.push(distractorURL);
                    }
                    
                    // update trialArray with array of distractors
                    var trialArray: string[] = randomDistractorURLs;
                } else {
                    // choose from list of targets and append to the 24 distractor images
                    // Construct 24 random distractor urls
                    const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid - 1);
                    var randomURLs: string[] = [];
                    for (var i = 0; i < randomDistractors.length; i++) {
                        const distractorURL: string = gorilla.stimuliURL(randomDistractors[i]);
                        randomURLs.push(distractorURL);
                    }
            
                    // add random condition url to a random place in the array
                    const randomConditionImage: string = utils.constructRandImageName(randomCondition);
                    const randomConditionImageURL: string = gorilla.stimuliURL(randomConditionImage);
                    utils.insertAtRandom(randomURLs, randomConditionImageURL);
                    
                    // update trialArray with array of distractors plus one random target
                    var trialArray: string[] = randomURLs;
                    
                    // TODO:
                    // Insert at random then DO NOT REPEAT POSITION
                } // end if
            }) // end button response on click
        }) // end populateAndLoad
    } // end function loadTrial
    
    while (true) {
        loadTrial();
        
        if (blockArray.length === 0) {
            break;
        }
    } //end while
})
