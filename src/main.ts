import gorilla = require('gorilla/gorilla');
import stateMachine = require("gorilla/state_machine");

import utils = require('utils');

const nImagesInGrid: number = 25;
var stimConditions: string[] = ['C', 'F', 'HF', 'LF'];
const exampleTargets: string[] = ["EC.jpg", "EF.jpg", "EP.jpg"];
const practiceImages: string[] = ["P1.jpg", "P2.jpg", "P3.jpg"];
const beforeFixationDelay: number = 500;
const fixationLength: number = 500;
const afterFixationDelay: number = 0;
// const presentationTime: number = 4000 + beforeFixationDelay + fixationLength + afterFixationDelay;
const presentationTime: number = 4000;
const timeoutMessageLength: number = 1000;

/* ------------------------------------- */

// possible states in state machine
enum State {
	Instructions,
	PracticeTrial,
	Trial,
	FixationCross,
	ImageArray,
	Block,
	Finish,
}

// our TrialStruct struct, which contains information
// about a trial, to be passed to different states
interface TrialStruct {
	trialArray: string[],
	trialNumber: number,
	trialCondition: string,
	isPresent: boolean,
	isPresentString: string,
	targetConditionCoded: number,
	targetImg: string,
	targetLocation: number,
	key: string,
	correct: number,
	responseTime: number,
	timedOut: boolean,
	// keypressAllowed: boolean,
}

interface BlockStruct {
    targetType: string,
    blockArray: number[],
    possibleTrialTargets: number[],
    possibleTrialPositions: number[],
}

interface InformationStruct {
	trialStruct: TrialStruct,
	blockStruct: BlockStruct
}

function constructURLArray(stimArr: string[]) {
    var URLs: string[] = [];
	for (var i = 0; i < stimArr.length; i++) {
		const URL: string = gorilla.stimuliURL(stimArr[i]);
		URLs.push(URL);
	}
	
	return URLs;
}

// global boolean variable which we update in order to check
// if we are allowed to press the response key or not
var keypressAllowed: boolean = false;

// this is the main gorilla function call!
gorilla.ready(function(){
    // initialise stopwatch
    gorilla.initialiseTimer();
	    
	// initialise state machine
	var SM = new stateMachine.StateMachine();
	
	// start at trial one
	var trial_number: number = gorilla.retrieve('trial_number', 1, true);
	var finishedFlag: boolean = gorilla.retrieve('finished', false, true);

	// In this state we will display our instructions for the task
	SM.addState(State.Instructions, {
		onEnter: (machine: stateMachine.Machine) => {
			var text: string = "Hello and welcome to this experiment.  It is the love child of genius people."
			var examples: string[] = constructURLArray(exampleTargets);
			gorilla.populate('#gorilla', 'instructions', {
			    introduction: text,
			    e1: examples[0],
			    e2: examples[1],
			    e3: examples[2],
			    imSize: "4cm"
			}); // end populate
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				// transition to the practice trials
				machine.transition(State.Block);
			}) // end on click start button
		} // end onEnter
	}) // end addState Instructions
	
	SM.addState(State.Block, {
	    onEnter: (machine: stateMachine.Machine) => {
			// upon entering the block after the final trial condition
			// we are duly finished and we need to immediately
			// transition to the finish state
			console.log(stimConditions);
			if (stimConditions.length === 0) {
				machine.transition(State.Finish)
			} else {
				// choose a random stimulus condition
		        const targetType: string = utils.takeRand(stimConditions);
				// here we define arrays of values so that we can choose a certain value,
			    // take it *from* the array, and that value is hence not repeating.
				var blockArray: number[] = utils.constructBlockArray();
				var possibleTrialTargets: number[] = utils.constructTargetArray();
				var possibleTrialPositions: number[] = utils.constructTargetArray();
		        
				let blockStruct = {
					targetType: targetType,
					blockArray: blockArray,
					possibleTrialTargets: possibleTrialTargets,
					possibleTrialPositions: possibleTrialPositions
				} as BlockStruct
				
				// populate our trial screen
				gorilla.populateAndLoad($('#gorilla'), 'block-instruction', {
					trialType: utils.encodeTargetTypeHR(targetType)
				}, (err) => {
					// transition when required
					$(document).one('keypress', (event: JQueryEventObject) => {
						// $(document).off('keypress');
						machine.transition(State.Trial, blockStruct);
					}) // end on keypress
				}) // end populate and load
			} // end if
	    }, // end onEnter
	    
	    // onExit: (machine: stateMachine.Machine) => {
		// 	if (stimConditions.length === 0) {
		// 		machine.transition(State.Finish)
		// 	}
		// }// end onExit
	}); // end add state Block
	
	// in this state, an array of images will be displayed and a response button
	// will be pressed
	SM.addState(State.Trial, {
		// the onEnter functions is executed when a state is entered
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			keypressAllowed = false;
			
			console.log(blockStruct.blockArray);
			if (blockStruct.blockArray.length === 0) {
				machine.transition(State.Block);
			} else {
				console.log("This is the trial type given to the state: " + blockStruct.targetType);
			    
				var trialArray: string[] = [];
				var currentTrial: number = 0;
				const randTrial: number = utils.takeRand(blockStruct.blockArray);
				console.log('The random trial number chosen is ' + randTrial);
				
				// some metrics for later
				const condType = utils.encodeTargetType(blockStruct.targetType);
				const blockCode: number = utils.getCondCode(blockStruct.targetType);

				let trialStruct = {
					trialArray: [],
					trialNumber: currentTrial,
					trialCondition: blockStruct.targetType,
					isPresent: null,
					isPresentString: condType,
					targetConditionCoded: blockCode,
					targetImg: null,
					targetLocation: null,
					key: null,
					correct: null,
					responseTime: null,
					timedOut: false,
					// keypressAllowed: keypressAllowed,
				} as TrialStruct;
				// stateMachine
				// hide so that all images are generated at the same time
				if (randTrial % 2 == 0) {
					// generate a list of 25 random distractors
					// Construct 25 random distractor urls
					const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid);
					const randomDistractorURLs: string[] = constructURLArray(randomDistractors);

					// update trialArray with array of distractors
					trialStruct.trialArray = randomDistractorURLs;
				    
				    // update metrics
					trialStruct.isPresent = false;
					trialStruct.isPresentString = 'absent';
				} else {
					// choose from list of targets and append to the 24 distractor images
					// Construct 24 random distractor urls
					const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid - 1);
					const randomURLs: string[] = constructURLArray(randomDistractors);

					// choose a random image from the possible image set.  This image cannot be repeated
					const randomImageNumber: number = utils.takeRand(blockStruct.possibleTrialTargets) + 1; // add one because array is from 0:24
					const conditionImage: string = utils.constructImageName(blockStruct.targetType, randomImageNumber);
					const conditionImageURL: string = gorilla.stimuliURL(conditionImage);
					
					// insert image at random position.  This position cannot be repeated
					const randPosition: number = utils.takeRand(blockStruct.possibleTrialPositions);
					utils.insert(randomURLs, randPosition, conditionImageURL)
					
					console.log('The target image is a ' + utils.encodeTargetType(blockStruct.targetType) + ' and is named ' + conditionImage);
					console.log('The target ' + utils.encodeTargetType(blockStruct.targetType) + ' is inserted at position ' + randPosition);
					
					trialStruct.trialArray = randomURLs;
					trialStruct.targetImg = conditionImage;
					trialStruct.isPresent = true;
					trialStruct.isPresentString = 'present';
					trialStruct.targetLocation = randPosition;
				} // end if

				let informationStruct = {
					blockStruct: blockStruct,
					trialStruct: trialStruct
				} as InformationStruct
				
				// hide the display till the images are loaded
				$('.trial-array').hide();
				$('.instruction').hide();
				$('.timeout-feedback').hide();
				
				// populate our trial screen
				gorilla.populateAndLoad($('#gorilla'), 'trial', { trials: trialStruct.trialArray }, (err) => {
					machine.transition(State.FixationCross, informationStruct);
				}) // end populate and load
				console.log('----------------------------------------------------------');
			} // end if-else
		}, // end onEnter

		// The onExit function is executed whenever a state is left.
		// It is the last thing a state will do
		// onExit: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
		// 	$(document).unbind('keypress')
		// 	if (blockStruct.blockArray.length === 0) {
		// 	    $(document).unbind('keypress');
		// 		machine.transition(State.Block);
		// 	}
		// } // end onExit
	}); // end addState Trial
	
	SM.addState(State.FixationCross, {
		onEnter: (machine: stateMachine.Machine, informationStruct: InformationStruct) => {
			$('.trial-array').hide();
 			$('.instruction').hide();
 			$('.timeout-feedback').hide();
			
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
			//
			machine.transition(State.ImageArray, informationStruct);
		}, // end onEnter
		
		// onExit: (machine: stateMachine.Machine, trialStruct: TrialStruct) => {
		// 	machine.transition(State.ImageArray, trialStruct);
		// } // end onExit
	}) // end addState for FixationCross
	
	SM.addState(State.ImageArray, {
		onEnter: (machine: stateMachine.Machine, informationStruct: InformationStruct) => {
			// initialise sequence for timeout
		    var stateTimer: gorilla.GorillaTimerSequence;
			
			// console.log("This is the trial structure given to the state: " + informationStruct.trialStruct);
			$('#gorilla')
				.queue(function () {
					$('.trial-array').show();
					$('.instruction').show();
					gorilla.refreshLayout();
					gorilla.startStopwatch();
					keypressAllowed = true;
					$(this).dequeue();
				}) // end queue for '#gorilla'
			
			$(document).off('keypress').on('keypress', (event: JQueryEventObject) => {
				// exit the keypress event if we are not allowed to
				if (!keypressAllowed) return;
				
				// get the key that was pressed
				const e = event.which;
				
				// enter state where it can't enter any more keys
				if (e === 107 || e === 108) {
					gorilla.stopStopwatch();
					
					// GET RESPONSE TIME
					informationStruct.trialStruct.responseTime = gorilla.getStopwatch();
					
					// stop timout timer
					stateTimer.cancel();
					
					// update keypress as we have just pressed the key!
					keypressAllowed = false;
					
					// get string of key pressed from character code
					var key = String.fromCharCode(e);
					
					// check if key press was correct
					if ((informationStruct.trialStruct.isPresent && e === 107) || (!informationStruct.trialStruct.isPresent && e === 108)) {
						informationStruct.trialStruct.correct = 1;
					} else {
						// We shouldn't have to use this else statement because
						// we preset isCorrect to be false, and only change it when
						// proven otherwise.  However, something is happening with
						// the scoping so I have to change it.  Don't ask why.
						informationStruct.trialStruct.correct = 0;
					}
					
					// Actually *store* the data!
					// IMPORTANT: these keys had to be imported into the `Metircs` tab!
					gorilla.metric({
						trial_number: informationStruct.trialStruct.trialNumber,
						trial_condition: informationStruct.trialStruct.isPresentString, // present or absent trial; previously "condition1"
						target_condition:  informationStruct.trialStruct.trialCondition, // type of condition; previously "condition2"
						target_condition_coded:  informationStruct.trialStruct.targetConditionCoded,
						target_img:  informationStruct.trialStruct.targetImg, // the name of the taget image (or null); previously "stim1"
						target_location:  informationStruct.trialStruct.targetLocation,
						key:  informationStruct.trialStruct.key, // the response key for this trial
						correct:  informationStruct.trialStruct.correct, // boolean; whether correct or not
						response_time:  informationStruct.trialStruct.responseTime, // response time
						timed_out: informationStruct.trialStruct.timedOut,
					}); // end metric
					
					// increment trial number
					informationStruct.trialStruct.trialNumber++;

					// move on transition
					$('#gorilla')
						.queue(function () {
							machine.transition(State.Trial, informationStruct.blockStruct);
							$(this).dequeue();
						}); // end queue for '#gorilla'
				} // end checking if key pressed is 75:76 (K or L)
			}) // end response keypress (event: JQueryEventObject)
			
			console.log('----------------------------------------------------------');
			var stateTimer: gorilla.GorillaTimerSequence = gorilla.addTimerSequence()
				.delay(presentationTime)
				.then(() => {
					$('.trial-array').hide();
					$('.instruction').hide();
					$('#gorilla')
					.queue(function() {
						$('.timeout-feedback').show();
						gorilla.refreshLayout();
						$(this).dequeue();
					})
					.delay(timeoutMessageLength)
					.queue(function() {
						$('.timeout-feedback').hide();
						gorilla.refreshLayout();
						$(this).dequeue();
					})

					gorilla.metric({
						trial_number: informationStruct.trialStruct.trialNumber,
						trial_condition: informationStruct.trialStruct.isPresentString,
						target_condition:  informationStruct.trialStruct.trialCondition,
						target_condition_coded:  informationStruct.trialStruct.targetConditionCoded,
						target_img:  informationStruct.trialStruct.targetImg, // the name of the taget image (or null); previously "stim1"
						target_location: informationStruct.trialStruct.targetLocation,
						key: null, // keypress timeout
						correct: null, // no response
						response_time: null, // response timeout
						timed_out: true,
					});// end metric
					
					$('#gorilla')
						.queue(function () {
							machine.transition(State.Trial, informationStruct.blockStruct);
							$(this).dequeue();
						}); // end queue for '#gorilla'
				})
				.run();
		}, // end onEnter
		
// 		onExit: (machine: stateMachine.Machine, metric: TrialStruct) => {
// 		} // end onExit
	}) // end addState ImageArray

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
		SM.start(State.Instructions);
	}) // end gorilla run
}) // end gorilla ready
