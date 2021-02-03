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
	PracticeTrial,
	Trial,
	Block,
	Finish,
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
	var trial_number: number = gorilla.retrieve('trial_number', 1, true);
	var finishedFlag: boolean = gorilla.retrieve('finished', false, true);

	// In this state we will display our instructions for the task
	SM.addState(State.Instructions, {
		onEnter: (machine: stateMachine.Machine) => {
			var text: string = "Hello and welcome to this experiment.  It is the love child of genius people."
			var examples: string[] = constructURLArray(["EC.jpg", "EF.jpg", "EP.jpg"]);
			gorilla.populate('#gorilla', 'instructions', {
			    introduction: text,
			    e1: examples[0],
			    e2: examples[1],
			    e3: examples[2],
			    imSize: "3cm"
			}); // end populate
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Trial);
			}) // end on click start button
		} // end onEnter
	}) // end addState Instructions

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
			var trialArray: string[] = [];
			var currentTrial: number = 0;
			const randTrial: number = utils.takeRand(blockArray);
			console.log('The random trial number chosen is ' + randTrial);

			// some metrics for later
			const condType = utils.encodeTargetType(constTrialType);
			const blockCode: number = utils.getCondCode(constTrialType);

			// initialising some metrics
			var randomTargetImage = null;
			var targetLocation = null;
			var isPresent: boolean = false;
			var isCorrect: boolean = false;
			var timedOut: boolean = false;

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
				
				// update metrics
				var trialArray: string[] = randomURLs;
				var targetImage: any = conditionImage;
				var isPresent: boolean = true;
				var targetLocation: any = randPosition;
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
					
					// check if key press was correct
					if ((isPresent && e === 107) || (!isPresent && e === 108)) {
						var isCorrect: boolean = true;
					} else {
						// We shouldn't have to use this else statement because
						// we preset isCorrect to be false, and only change it when
						// proven otherwise.  However, something is happening with
						// the scoping so I have to change it.  Don't ask why.
						var isCorrect: boolean = false;
					}
					
                    if (e === 107 || e === 108) {
                        // get string of key pressed from character code
                        var key = String.fromCharCode(e);
						
						// Actually *store* the data!
						// IMPORTANT: these keys had to be imported into the `Metircs` tab!
						// It took me far too long to figure this out.
						gorilla.metric({
							trial_number: trial_number,
							trial_condition: isPresent, // present or absent trial; previously "condition1"
							target_condition: condType, // type of condition; previously "condition2"
							target_condition_coded: blockCode,
							target_img: targetImage, // the name of the taget image (or null); previously "stim1"
							target_location: targetLocation,
							key: key, // the response key for this trial
							correct: isCorrect, // boolean; whether correct or not
							response_time: null, // response time
							timed_out: timedOut,
						}) // end metric
						
    					// increment trial number
    					trial_number++;
    
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
				gorilla.metric({
					finished: trialFinished
				})
				machine.transition(State.Finish);
			} // end if
		} // end onExit
	}); // end addState Trial

	// this is the state we enter when we have finished the task
	SM.addState(State.Finish, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'finish', {});
			gorilla.refreshLayout();
			$('#finish-button').one('click', (event: JQueryEventObject) => {
				gorilla.finish();
			})
		} // end onEnter
	}) // end addState Finish

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
