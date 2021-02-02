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
	
    while (true) {
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
	    }
    
	    // Build our screen
        $('#gorilla').hide();
        
        // gorilla.refreshLayout();
	    gorilla.populateAndLoad($('#gorilla'), 'exp', { trials: trialArray }, (err) => {
	        $('#gorilla').show();
	     
	        // FIRST ATTEMPT
	        /*$('#exit-button').on('click', ()=>{
		        gorilla.metric({
			        event: 'Button clicked!'
		        });

		        gorilla.finish();
	           })*/
            
            $('.response-button').on('click', () => {
                // Display the fixation cross
                // $('#gorilla')
                //     .queue(function(){
                //         $('.gorilla-fixation-cross').show();
                //         gorilla.refreshLayout();
                //         $(this).dequeue();
                //     })
                //     .delay(fixationLength)
                //     .queue(function(){
                //         $('.gorilla-fixation-cross').hide();
                //         gorilla.refreshLayout();
                //         $(this).dequeue();
                //     })
                //     .delay(500);
                
                // gorilla.metric({
                //     profile: profile.template,
                //     rent: rentDecision,
                //     time_taken: timeTaken,
                // });
            
                done();
            })
	       
	       // USING-OUTDATED-CODE ATTEMPT
	       /*$('.response-button').prop('disabled', true);
	       $('#gorilla')
	            .delay(200)
	            .queue(function() {
	                $('.gorilla-fixation-cross').show();
	                gorilla.refreshLayout();
	                $(this).dequeue();
	            })
	            .delay(500)
	            .queue(function() {
	                $('.gorilla-fixation-cross').hide();
	                $(this).dequeue();
	            })
	                .delay(200)
	                .queue(function() {
	                    $('.stimuli').show();
	                    gorilla.refreshLayout();
	                    $('.response-button').prop('disabled', false);
	                    gorilla.startStopwatch();
	                    $(this).dequeue();
	                })
	            
	            $('.response-button').one('click', (event) => {
	                // unbind the other answer buttons
	                $('.response-button').off('click');
	                gorilla.stopStopwatch();
	                var rt = gorilla.getStopwatch();
	                
	                currentTrial++;
	                gorilla.store(GorillaStoreKeys.CurrentTrial, currentTrial);
	                
	                var answer = $(event.currentTarget).data('answer');
	                
	                var correct = false;
	                
	                gorilla.refreshLayout();
	                
	               // gorilla.metric();
	            })*/
	     })
	        
        if (blockArray.length === 0) {
            break;
        }
} // end while
})
