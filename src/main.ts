import gorilla = require('gorilla/gorilla');
import stateMachine = require("gorilla/state_machine");

import utils = require('utils');

const nImagesInGrid: number = 25;
var stimConditions: string[] = ['D', 'C', 'F', 'HF', 'LF'];
const beforeFixationDelay: number = 0;
const fixationLength: number = 500;
const afterFixationDelay: number = 0;

/* ------------------------------------- */

// possible states in state machine
enum State {
	Instructions,
	Block,
	Trial,
	Finish,
}

var GorillaStoreKeys = {
	CurrentTrialNo: 'currentTrialNo',
	CurrentRoundNumber: 'currentRoundNumber',
	Finished: 'finished'
}

function constructURLArray(stimArr: string[]) {
    var URLs: string[] = [];
	for (var i = 0; i < stimArr.length; i++) {
		const URL: string = gorilla.stimuliURL(stimArr[i]);
		URLs.push(URL);
	}
	
	return URLs;
}

gorilla.ready(function(){
    const constTrialType: string = 'F';
    
	// initialise state machine
	var SM = new stateMachine.StateMachine();
	// start at trial one
	var trial_number: number = 1;
	var finishedFlag: boolean = gorilla.retrieve(GorillaStoreKeys.Finished, false);

	// In this state we will display our instructions for the task
	SM.addState(State.Instructions, {
		onEnter: (machine: stateMachine.Machine) => {
			var text: string = "Hello and welcome to this experiment.  It is the love child of genius people."
			gorilla.populate('#gorilla', 'instructions', {introduction: text});
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Trial);
			}) // end on click start button
		} // end onEnter
	}) // end addState

    // here we define arrays of values so that we can choose a certain value,
    // take it *from* the array, and that value is hence not repeating.
	var blockArray: number[] = utils.constructBlockArray();
	var possibleTrialTargets: number[] = utils.constructTargetArray();
	var possibleTrialPositions: number[] = utils.constructTargetArray();

	// in this state, an array of images will be displayed and a response button
	// will be pressed
	SM.addState(State.Trial, {
		// the onEnter functions is executed when a state is entered
		onEnter: (machine: stateMachine.Machine) => {
			const randomCondition: string = utils.randVal(stimConditions); // previously takeRand
			var trialArray: string[] = [];
			var currentTrial: number = 0;
			const randTrial: number = utils.takeRand(blockArray);
			console.log('The random trial number chosen is ' + randTrial);

			// some metrics for later
			const condType = utils.encodeTargetType(randomCondition);
			const blockCode: number = utils.getCondCode(randomCondition);

			// initialising some metrics
			var randomTargetImage = null;
			var isPresent: boolean = false;

			// hide so that all images are generated at the same time
			if (randTrial % 2 == 0) {
				// generate a list of 25 random distractors
				// Construct 25 random distractor urls
				const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid);
				const randomDistractorURLs: string[] = constructURLArray(randomDistractors);

				// update trialArray with array of distractors
				var trialArray: string[] = randomDistractorURLs;
			} else {
				// choose from list of targets and append to the 24 distractor images
				// Construct 24 random distractor urls
				const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid - 1);
				const randomURLs: string[] = constructURLArray(randomDistractors);

				// choose a random image from the possible image set.  This image cannot be repeated
				const randomImageNumber: number = utils.takeRand(possibleTrialTargets) + 1; // add one because array is from 0:24
				const conditionImage: string = utils.constructImageName(constTrialType, randomImageNumber);
				const conditionImageURL: string = gorilla.stimuliURL(conditionImage);
				
				// insert image at random position.  This position cannot be repeated
				const randPosition: number = utils.takeRand(possibleTrialPositions);
				utils.insert(randomURLs, randPosition, conditionImageURL)
				
				console.log('The target image is a ' + utils.encodeTargetType(constTrialType) + ' and is named ' + conditionImage);
				console.log('The target ' + utils.encodeTargetType(constTrialType) + ' is inserted at position ' + randPosition);
				// update trialArray with array of distractors plus one random target
				var trialArray: string[] = randomURLs;
				// update target image name
				var randomTargetImage: any = conditionImage;
				// update isPresent variable (i.e., target has been shown)
				var isPresent: boolean = true;
			} // end if

			// hide the display till the images are loaded
 			// $('#gorilla').hide();
 			$('.trial-array').hide();
 			$('.instruction').hide();
			// populate our trial screen
			gorilla.populateAndLoad($('#gorilla'), 'trial', { trials: trialArray }, (err) => {
				// Display the fixation cross
				$('#gorilla')
				    .delay(beforeFixationDelay)
    				.queue(function () {
        				$('.fixation-cross').show();
        				gorilla.refreshLayout();
        				$(this).dequeue();
    				})// end queue for '#gorilla'
    				.delay(fixationLength)
    				.queue(function () {
        				$('.fixation-cross').hide();
        				gorilla.refreshLayout();
        				$(this).dequeue();
    				}) // end queue for '#gorilla'
    				.delay(afterFixationDelay);

				// display array of images
				$('#gorilla')
				    .queue(function () {
				        $('.trial-array').show();
				        $('.instruction').show();
				        // $('#gorilla').show();
				        gorilla.refreshLayout();
				        $(this).dequeue();
				    }) // end queue for '#gorilla'
                
                $(document).off('keypress').on('keypress', (event: JQueryEventObject) => {
                    const e = event.which;

                    if (e === 107 || e === 108) {
                        // get string of key pressed from character code
                        var key = String.fromCharCode(e);

    					gorilla.metric({
    						trialNo: trial_number,
    						trial_condition: isPresent, // present or absent trial; previously "condition1"
    						target_condition: condType, // type of condition; previously "condition2"
    						target_img: randomTargetImage, // the name of the taget image (or null); previously "stim1"
    						target_location: null,
    						key: null, // the response key for this trial
    						correct: null, // boolean; whether correct or not
    						response_time: null, // response time
    						reponse_time: null,
    					}) // end metric
    
    					// increment trial number
    					trial_number++;
    					gorilla.store(GorillaStoreKeys.CurrentTrialNo, trial_number);
    
    					// move on transition
    					$('#gorilla')
    						.queue(function () {
    							machine.transition(State.Trial);
    							$(this).dequeue();
    						}); // end queue for '#gorilla'
                    } // end checking if key pressed is 75:76 (K or L)
    			}) // end response keypress (event: JQueryEventObject)
			}) // end populate and load
			console.log('----------------------------------------------------------');
		}, // end onEnter

		// The onExit function is executed whenever a state is left.  
		// It is the last thing a state will do
		onExit: (machine: stateMachine.Machine) => {
			if (blockArray.length === 0) {
			    $(document).off('keypress')
				var trialFinished: boolean = true;
				gorilla.store(GorillaStoreKeys.Finished, trialFinished);
				machine.transition(State.Finish);
			} // end if
		} // end onExit
	}); // end addState

	// this is the state we enter when we have finished the task
	SM.addState(State.Finish, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'finish', {});
			gorilla.refreshLayout();
			$('#finish-button').one('click', (event: JQueryEventObject) => {
				gorilla.finish();
			})
		} // end onEnter
	}) // end addState

	// calling this function starts gorilla and the task as a whole
	gorilla.run(function () {
		// while (true) {
		if (!finishedFlag) {
			SM.start(State.Instructions);

		// if (blockArray.length === 0) {
		//     break;
		// }
		} else { //end while

			SM.start(State.Finish);
		}
	}) // end gorilla run
}) // end gorilla ready
