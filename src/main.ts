/*
Today we:
  - [feature] Added practice trials (states);
  - [bug] Fixed trial count
  - [feature] Added flexible target proportions (e.g., 0.5 =? 50% of trials are targets);
  - [feature] Added feedback for practice trials (i.e., after each trial telling participants whether or not they were correct in their response);
  - [feature] Now record trial array (e.g., ["D9.jpg", "D1.jpg", "D19.jpg", ..., "F12.jpg", ..., "D16.jpg"]);
  - [feature] Added practice instructions to display before practice trials;
  - [edit] Added bird images for practice trials instead of faces;
  - [edit] Updated instructions;
  - [feature] Added after-practice instructions (states);
  - [edit] Updated in-trial instructions;

Still to do:
  - [feature] Add demographics state and record responses.
  - [bug?] Timing bug?;
  - [feature] ITI metric?
*/

import gorilla = require('gorilla/gorilla');
import stateMachine = require("gorilla/state_machine");

import utils = require('utils');

const nImagesInGrid: number = 25;
var stimConditions: string[] = ['C', 'F', 'HF', 'LF'];
const exampleTargets: string[] = ['EC.jpg', 'EF.jpg', 'EP.jpg'];
const beforeFixationDelay: number = 500;
const fixationLength: number = 500;
const afterFixationDelay: number = 0;
const rawPresentationTime: number = 5000;
const presentationTime: number = rawPresentationTime + beforeFixationDelay + fixationLength + afterFixationDelay;
// const presentationTime: number = rawPresentationTime;
const timeoutMessageLength: number = 1000;
const practiceFeedbackMessageLength: number = 1000;
const exampleImSize: string = "4cm";

const exampleImages: Object = {
    'C': 'EC.jpg',
    'F': 'EF.jpg',
    'P': 'EP.jpg', // pareidolia
    'HF': ['EP1.jpg', 'EP2.jpg', 'EP3.jpg', 'EP4.jpg'],
    'LF': ['EP1.jpg', 'EP2.jpg', 'EP3.jpg', 'EP4.jpg'],
};

/* ------------------------------------- */

// possible states in state machine
enum State {
	Instructions,
	PracticeInstructions,
	PracticeTrial,
	PracticeFixationCross,
	PracticeImageArray,
	AfterPracticeInstructions,
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
	humanReadableTrialArray: string[],
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

interface PracticeTrialStruct {
	practiceTargets: string[],
	practiceArrays: number[],
	practiceTarget: string,
	isPresent: boolean,
	practiceTargetPositions: number[],
	practiceArray: string[]
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

// set trial number
var trialNumber: number = 1;

var incorrectPracticeCounter: number = 0

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
// 			var text: string = "Hello and welcome to this experiment.  It is the love child of genius people."
            var text: string = "Hello and welcome to this experiment."
			var examples: string[] = constructURLArray(exampleTargets);
			gorilla.populate('#gorilla', 'instructions', {
			    introduction: text,
			    e1: examples[0],
			    e2: examples[1],
			    e3: examples[2],
			    imSize: exampleImSize
			}); // end populate
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				// transition to the practice trials
				machine.transition(State.Block);
				// machine.transition(State.Block);
			}) // end on click start button
		} // end onEnter
	}) // end addState Instructions
	
	SM.addState(State.PracticeInstructions, {
	    onEnter: (machine: stateMachine.Machine) => {
			var examples: string[] = constructURLArray(exampleTargets);
			gorilla.populate('#gorilla', 'practice-instructions', {
			    example: gorilla.stimuliURL(utils.randVal(utils.generatePracticeArray())),
			    imSize: exampleImSize
			}); // end populate
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				// transition to the practice trials
				let practiceStruct = {
					practiceTargets: utils.generatePracticeArray(),
					practiceArrays: utils.constructPracticeArray(),
					practiceTarget: '',
					practiceTargetPositions: utils.constructTargetArray()
				} as PracticeTrialStruct
				machine.transition(State.PracticeTrial, practiceStruct);
				// machine.transition(State.Block);
			}) // end on click start button
	    } // end onEnter
	}) // end addState PracticeInstructions
	
	SM.addState(State.PracticeTrial, {
	    onEnter: (machine: stateMachine.Machine, practiceStruct: PracticeTrialStruct) => {
			practiceStruct.practiceArray = [];
	        keypressAllowed = false;
	        
	        console.log(practiceStruct.practiceArrays);
	        
	        if (practiceStruct.practiceArrays.length === 0) {
	            machine.transition(State.AfterPracticeInstructions);
	        } else {
	            var trialArray: string[] = [];
	            const randTrial: number = utils.takeRand(practiceStruct.practiceArrays);
				
	            // stateMachine
	            // hide so that all images are generated at the same time
	            if (randTrial % utils.moduloVal == 0) {
	                // generate a list of 25 random distractors
	                // Construct 25 random distractor urls
	                const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid);
	                const randomDistractorURLs: string[] = constructURLArray(randomDistractors);
	                                
	                // update metrics
	                practiceStruct.isPresent = false;
	                practiceStruct.practiceArray = randomDistractorURLs;
	            } else {
	                // choose from list of targets and append to the 24 distractor images
	                // Construct 24 random distractor urls
	                const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid - 1);
	                const randomURLs: string[] = constructURLArray(randomDistractors);

	                // choose a random image from the possible image set.  This image cannot be repeated
	                const practiceImage: string = utils.takeRand(practiceStruct.practiceTargets);
	                const conditionImageURL: string = gorilla.stimuliURL(practiceImage);
	                
	                // insert image at random position.  This position cannot be repeated
	                const randPosition: number = utils.takeRand(practiceStruct.practiceTargetPositions);
	                utils.insert(randomURLs, randPosition, conditionImageURL)
	                
	                practiceStruct.isPresent = true;
	                practiceStruct.practiceArray = randomURLs;
	            } // end if
	            
	            // hide the display till the images are loaded
	            $('.trial-array').hide();
	            $('.instruction').hide();
	            $('.timeout-feedback').hide();
	            $('.practice-feedback-correct').hide();
	            $('.practice-feedback-incorrect').hide();
	            
	            // populate our trial screen
	            gorilla.populateAndLoad($('#gorilla'), 'trial', { trials: practiceStruct.practiceArray }, (err) => {
	                machine.transition(State.PracticeFixationCross, practiceStruct);
	            }) // end populate and load
	            console.log('----------------------------------------------------------');
	        } // end if-else
	    }, // end onEnter
	}) // end addState PracticeTrial

	SM.addState(State.PracticeFixationCross, {
	    onEnter: (machine: stateMachine.Machine, practiceStruct: PracticeTrialStruct) => {
	        $('.trial-array').hide();
	        $('.instruction').hide();
	        $('.timeout-feedback').hide();
	        $('.practice-feedback-correct').hide();
	        $('.practice-feedback-incorrect').hide();
	        
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
	        machine.transition(State.PracticeImageArray, practiceStruct);
	    }, // end onEnter
	}) // end addState for FixationCross

	SM.addState(State.PracticeImageArray, {
	    onEnter: (machine: stateMachine.Machine, practiceStruct: PracticeTrialStruct) => {
	        // initialise sequence for timeout
	        // potentially put this in a queue
	        // possibly the queue below
	        var stateTimer: any = null;
	        
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
	                // stop timout timer
	                stateTimer.cancel();
	                
	                // update keypress as we have just pressed the key!
	                keypressAllowed = false;
	                
	                // check if key press was correct
	                if ((practiceStruct.isPresent && e === 107) || (!practiceStruct.isPresent && e === 108)) {
	                    console.log()
	                    // correct
	                   $('#gorilla')
	                    .queue(function() {
	                        $('.trial-array').hide();
	                        $('.instruction').hide();
	                        $('.practice-feedback-correct').show();
	                        gorilla.refreshLayout();
	                        $(this).dequeue();
	                    })
	                    .delay(practiceFeedbackMessageLength)
	                    .queue(function() {
	                        $('.practice-feedback-correct').hide();
	                        gorilla.refreshLayout();
	                        $(this).dequeue();
	                    })
	                } else {
	                    // incorrect!
	                    incorrectPracticeCounter++;
	                    var incorrectMessage: string;
	                    console.log(incorrectPracticeCounter);
	                    console.log(incorrectMessage);
	                    switch (incorrectPracticeCounter) {
	                        case 1: 
	                            incorrectMessage = "Incorrect.";
	                            break;
	                        case 2: 
	                            incorrectMessage = "Incorrect again...";
	                            break;
	                        case 3: 
	                            incorrectMessage = "Are you even trying?";
	                            break;
	                        case 4: 
	                            incorrectMessage = "Seriously, are you joking with me?";
	                            break;
	                        case 5: 
	                            incorrectMessage = "Right, so you're not trying.";
	                            break;
	                        case 6: 
	                            incorrectMessage = "Children could do better than you.";
	                            break;
	                        case 7: 
	                            incorrectMessage = "You're wasting everybody's time.";
	                            break;
	                        case 8: 
	                            incorrectMessage = "Look at yourself, you look ridiculous.";
	                            break;
	                        case 9: 
	                            incorrectMessage = "[sigh]";
	                            break;
	                        case 10: 
	                            incorrectMessage = "This relationship isn't working out.";
	                            break;
	                        case 11: 
	                            incorrectMessage = "You're breaking my heart.";
	                            break;
	                        case 12: 
	                            incorrectMessage = "We are genuinely considering disqualifying you from this experiment";
	                            break;
	                    };
	                    gorilla.populate('#gorilla', 'trial', {incorrectMessage: incorrectMessage}); // end populate
	                    $('#gorilla')
	                    .queue(function() {
	                        $('.trial-array').hide();
	                        $('.instruction').hide();
	                        $('.practice-feedback-incorrect').show();
	                        gorilla.refreshLayout();
	                        $(this).dequeue();
	                    })
	                    .delay(practiceFeedbackMessageLength)
	                    .queue(function() {
	                        $('.practice-feedback-incorrect').hide();
	                        gorilla.refreshLayout();
	                        $(this).dequeue();
	                    })
	                }
	                
	                // move on transition
	                $('#gorilla')
	                    .queue(function () {
	                        machine.transition(State.PracticeTrial, practiceStruct);
	                        $(this).dequeue();
	                    }); // end queue for '#gorilla'
	            } // end checking if key pressed is 75:76 (K or L)
	        }) // end response keypress (event: JQueryEventObject)
	        
	        console.log('----------------------------------------------------------');
	        // var stateTimer: gorilla.GorillaTimerSequence = gorilla.addTimerSequence()
	        stateTimer = gorilla.addTimerSequence()
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
	                
	                $('#gorilla')
	                    .queue(function () {
	                        machine.transition(State.PracticeTrial, practiceStruct);
	                        $(this).dequeue();
	                    }); // end queue for '#gorilla'
	            })
	            .run();
	    }, // end onEnter
	}) // end addState PracticeImageArray
	
	SM.addState(State.AfterPracticeInstructions, {
	    onEnter: (machine: stateMachine.Machine) => {
			// populate our trial screen
				gorilla.populateAndLoad($('#gorilla'), 'after-practice', {}, (err) => {
					// transition when required
					$('#start-button').one('click', (event: JQueryEventObject) => {
						machine.transition(State.Block);
					}) // end on keypress
				}) // end populate and load
	    } // end onEnter
	}) // end addState AfterPracticeInstructions
	
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
				} as BlockStruct;
				
				// populate our trial screen
				if ((targetType === 'LF') || (targetType === 'HF')) {
				    const examples: string[] = exampleImages[targetType];
				    const possibleExamples: number[] = utils._constructNumberArray(1, examples.length);
				    $('.pareidolia-block').show();
				    gorilla.refreshLayout();
				    gorilla.populateAndLoad($('#gorilla'), 'block-instruction', {
    					trialType: utils.encodeTargetTypeHR(targetType),
    					e1: gorilla.stimuliURL(examples[utils.takeRand(possibleExamples)]),
    					e2: gorilla.stimuliURL(examples[utils.takeRand(possibleExamples)]),
    					e3: gorilla.stimuliURL(examples[utils.takeRand(possibleExamples)]),
    					e4: gorilla.stimuliURL(examples[utils.takeRand(possibleExamples)]),
    					imSize: exampleImSize
    			        }, (err) => {
        					// transition when required
        					$(document).one('keypress', (event: JQueryEventObject) => {
        						// $(document).off('keypress');
        						machine.transition(State.Trial, blockStruct);
        					}) // end on keypress
    				}) // end populate and load
				}
				else {
				    $('.std-block').show();
				    gorilla.refreshLayout();
    				gorilla.populateAndLoad($('#gorilla'), 'block-instruction', {
    					trialType: utils.encodeTargetTypeHR(targetType),
    					example: gorilla.stimuliURL(exampleImages['C']),
    					imSize: exampleImSize
    			        }, (err) => {
        					// transition when required
        					$(document).one('keypress', (event: JQueryEventObject) => {
        						// $(document).off('keypress');
        						machine.transition(State.Trial, blockStruct);
        					}) // end on keypress
    				}) // end populate and load
				} // end target type checking for variable display
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
				const randTrial: number = utils.takeRand(blockStruct.blockArray);
				console.log('The random trial number chosen is ' + randTrial);
				
				// some metrics for later
				const condType = utils.encodeTargetType(blockStruct.targetType);
				const blockCode: number = utils.getCondCode(blockStruct.targetType);

				let trialStruct = {
					trialArray: [],
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
				if (randTrial % utils.moduloVal == 0) {
					// generate a list of 25 random distractors
					// Construct 25 random distractor urls
					const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid);
					const randomDistractorURLs: string[] = constructURLArray(randomDistractors);

					// update trialArray with array of distractors
					trialStruct.trialArray = randomDistractorURLs;
				    
				    // update metrics
				    trialStruct.humanReadableTrialArray = randomDistractors;
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
					
					// update metrics
					trialStruct.trialArray = randomURLs;
					trialStruct.humanReadableTrialArray = utils.insert(randomDistractors, randPosition, conditionImage);
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
				$('.practice-feedback-correct').hide();
	            $('.practice-feedback-incorrect').hide();
				
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
 			$('.practice-feedback-correct').hide();
	        $('.practice-feedback-incorrect').hide();
			
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
		    // var stateTimer: gorilla.GorillaTimerSequence;
			// potentially put this in a queue
			// possibly the queue below
			var stateTimer: any = null;
			
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
						trial_number: trialNumber,
						trial_condition: informationStruct.trialStruct.isPresentString, // present or absent trial; previously "condition1"
						target_condition:  informationStruct.trialStruct.trialCondition, // type of condition; previously "condition2"
						target_condition_coded:  informationStruct.trialStruct.targetConditionCoded,
						target_img:  informationStruct.trialStruct.targetImg, // the name of the taget image (or null); previously "stim1"
						target_location:  informationStruct.trialStruct.targetLocation,
						key:  informationStruct.trialStruct.key, // the response key for this trial
						correct:  informationStruct.trialStruct.correct, // boolean; whether correct or not
						response_time:  informationStruct.trialStruct.responseTime, // response time
						timed_out: informationStruct.trialStruct.timedOut,
						trial_array: informationStruct.trialStruct.humanReadableTrialArray,
					}); // end metric
					
					// increment trial number
					trialNumber++;

					// move on transition
					$('#gorilla')
						.queue(function () {
							machine.transition(State.Trial, informationStruct.blockStruct);
							$(this).dequeue();
						}); // end queue for '#gorilla'
				} // end checking if key pressed is 75:76 (K or L)
			}) // end response keypress (event: JQueryEventObject)
			
			console.log('----------------------------------------------------------');
			// var stateTimer: gorilla.GorillaTimerSequence = gorilla.addTimerSequence()
			stateTimer = gorilla.addTimerSequence()
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
						trial_number: trialNumber,
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
