import gorilla = require('gorilla/gorilla');
import stateMachine = require("gorilla/state_machine");

import utils = require('utils');

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
const exampleImSize: string = "3cm";
const consentFilename: string = "PareidoliaVisualSearch_InfoSheet.pdf";
const debriefFilename: string = "PareidoliaVisualSearch_Debriefing.pdf";

const exampleImages: Object = {
    'C': 'EC.jpg',
    'F': 'EF.jpg',
    'P': ['P1.jpg', 'P2.jpg', 'P3.jpg', 'P4.jpg', 'P5.jpg', 'P6.jpg'], // practice
    'HF': ['PE1.jpg', 'PE2.jpg', 'PE3.jpg', 'PE4.jpg'], // pareidolia example
    'LF': ['PE1.jpg', 'PE2.jpg', 'PE3.jpg', 'PE4.jpg'],
};

/* ------------------------------------- */

// possible states in state machine
enum State {
	Consent,
	RequestFullscreen,
	Demographics,
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
	Debrief,
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
var trialNumber: number = 0;

// block counter and number of blocks for block title
var blockCounter: number = 0;
const nBlocks: number = stimConditions.length;

// // onclick for dropdown press
// window.onclick = function(event) {
// 	if (!event.target.matches('.dropbtn')) {
// 		var dropdowns = document.getElementsByClassName("dropdown-content");
// 		var i;
// 		for (i = 0; i < dropdowns.length; i++) {
// 			var openDropdown = dropdowns[i];
// 			if (openDropdown.classList.contains('show')) {
// 				openDropdown.classList.remove('show');
// 			}
// 		}
// 	}
// }

// this is the main gorilla function call!
gorilla.ready(function(){
    // initialise stopwatch
    gorilla.initialiseTimer();
	    
	// initialise state machine
	var SM = new stateMachine.StateMachine();
	
	// start at trial one
	var trial_number: number = gorilla.retrieve('trial_number', 1, true);

	SM.addState(State.Consent, {
		onEnter: (machine: stateMachine.Machine) => {
		  //  var elem = document.body; // Make the body go full screen.
            // requestFullScreen(elem);
            
			gorilla.populate('#gorilla', 'consent', {
				consentform: gorilla.resourceURL(consentFilename)
			})
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.RequestFullscreen);
			}) // end on keypress
			$('#decline-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Finish);
			}) // end on keypress
		} // end onEnter
	}) // end addState State.Consent
	
	SM.addState(State.RequestFullscreen, {
		onEnter: (machine: stateMachine.Machine) => {
		  //  var elem = document.body; // Make the body go full screen.
            // requestFullScreen(elem);
            
			gorilla.populate('#gorilla', 'request-fs', {})
			gorilla.refreshLayout();
			$('#fs-button').one('click', (event: JQueryEventObject) => {
			    if(!utils.isFullscreen()){
                    utils.launchIntoFullscreen(document.documentElement);
                }
				// machine.transition(State.Demographics);
				machine.transition(State.Instructions);
			}) // end on keypress
			$(document).one('keypress', (event: JQueryEventObject) => {
			    if(!utils.isFullscreen()){
                    utils.launchIntoFullscreen(document.documentElement);
                }
				// machine.transition(State.Demographics);
				machine.transition(State.Instructions);
			}) // end on keypress
		} // end onEnter
	}) // end addState State.Consent
	
	SM.addState(State.Demographics, {
		onEnter: (machine: stateMachine.Machine) => {
		  //  var elem = document.body; // Make the body go full screen.
            // requestFullScreen(elem);
            
			gorilla.populate('#gorilla', 'demographics', {})
			gorilla.refreshLayout();
			
			// $('#dropdown').one('click', (event: JQueryEventObject) => {
			// 	utils.toggleDropdown();
			// }) // end on dropdown press
			
			$('#next-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Instructions);
			}) // end on click
		} // end onEnter
	}) // end addState State.Consent

	// In this state we will display our instructions for the task
	SM.addState(State.Instructions, {
	    onEnter: (machine: stateMachine.Machine) => {
	// 			var text: string = "Hello and welcome to this experiment.  It is the love child of genius people."
	        var text: string = "Hello and welcome to this experiment."
	        var examples: string[] = constructURLArray(exampleTargets);
	        // $('.instructions-content').hide();
			$('#gorilla').hide();
	        gorilla.populateAndLoad($('#gorilla'), 'instructions', {
// 			gorilla.populate('#gorilla', 'instructions', {
	            introduction: text,
	            e1: examples[0],
	            e2: examples[1],
	            e3: examples[2],
	            imSize: exampleImSize
// 			}
	        },
// 			);
	        // });
	        (err) => {
				$('#gorilla').show();
		            // $('.instructions-content').show();
		           // gorilla.refreshLayout();
		        // }); // end populateAndLoad
				// $('#gorilla').show();
				$('#start-button').one('click', (event: JQueryEventObject) => {
					// transition to the practice trials
					machine.transition(State.PracticeInstructions);
				// 	machine.transition(State.Block);
				}) // end on click start button
	        }); // end populate and load
	    } // end onEnter
	}) // end addState Instructions
	
	SM.addState(State.PracticeInstructions, {
	    onEnter: (machine: stateMachine.Machine) => {
			var examples: string[] = constructURLArray(exampleTargets);
			// gorilla.populate('#gorilla', 'practice-instructions', {
			//     example: gorilla.stimuliURL(utils.randVal(utils.generatePracticeArray())),
			//     imSize: exampleImSize
			// }); // end populate
			$('#gorilla').hide();
	        gorilla.populateAndLoad($('#gorilla'), 'practice-instructions', {
				example: gorilla.stimuliURL(utils.randVal(utils.generatePracticeArray())),
			   imSize: exampleImSize
		   	}, (err) => {
				$('#gorilla').show();
				// gorilla.refreshLayout();
				$('#start-button').one('click', (event: JQueryEventObject) => {
					// transition to the practice trials
					let practiceStruct = {
						practiceTargets: utils.generatePracticeArray(),
						practiceArrays: utils.constructPracticeArray(),
						practiceTarget: '',
						practiceTargetPositions: utils.constructTargetPositions()
					} as PracticeTrialStruct
					machine.transition(State.PracticeTrial, practiceStruct);
				}) // end on click start button
			}); // end populateAndLoad
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
	            if (randTrial % utils.practiceModuloVal == 0) {
	                // generate a list of 25 random distractors
	                // Construct 25 random distractor urls
	                const randomDistractors: string[] = utils.generateDistractorArray(utils.nImagesInGrid);
	                const randomDistractorURLs: string[] = constructURLArray(randomDistractors);
	                                
	                // update metrics
	                practiceStruct.isPresent = false;
	                practiceStruct.practiceArray = randomDistractorURLs;
	            } else {
	                // choose from list of targets and append to the 24 distractor images
	                // Construct 24 random distractor urls
	                const randomDistractors: string[] = utils.generateDistractorArray(utils.nImagesInGrid - 1);
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
	                keypressAllowed = false;
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
			    // increment block counter
			    blockCounter++;
				// choose a random stimulus condition
		        const targetType: string = utils.takeRand(stimConditions);
				// here we define arrays of values so that we can choose a certain value,
			    // take it *from* the array, and that value is hence not repeating.
				var blockArray: number[] = utils.constructBlockArray();
				var possibleTrialTargets: number[] = utils.constructTargetArray();
				var possibleTrialPositions: number[] = utils.constructTargetPositions();
		        
				let blockStruct = {
					targetType: targetType,
					blockArray: blockArray,
					possibleTrialTargets: possibleTrialTargets,
					possibleTrialPositions: possibleTrialPositions
				} as BlockStruct;
				
				// $('.std-block').hide();
				// $('.pareidolia-block').hide();
				
				// const examples: string[] = exampleImages[targetType];
				// const possibleExamples: number[] = utils._constructNumberArray(1, examples.length);
				
				// gorilla.populate('#gorilla', 'block-instructions', {
				// 	trialType: utils.encodeTargetTypeHR(targetType),
				// 	example: gorilla.stimuliURL(exampleImages['C']),
				// 	e1: gorilla.stimuliURL(examples[utils.takeRand(possibleExamples)]),
				// 	e2: gorilla.stimuliURL(examples[utils.takeRand(possibleExamples)]),
				// 	e3: gorilla.stimuliURL(examples[utils.takeRand(possibleExamples)]),
				// 	e4: gorilla.stimuliURL(examples[utils.takeRand(possibleExamples)]),
				// 	imSize: exampleImSize
				// }); // end populate
				
				// populate our trial screen
				$('#gorilla').hide();
				if ((targetType === 'LF') || (targetType === 'HF')) {
					const examples: string[] = utils.shuffle(exampleImages[targetType]);
					// $('.pareidolia-block').hide();
					// gorilla.refreshLayout();
					gorilla.populateAndLoad($('#gorilla'), 'pareidolia-block-instructions', {
					// gorilla.populate('#gorilla', 'pareidolia-block-instructions', {
					    blockCounter: blockCounter,
					    nBlocks: nBlocks,
						trialType: utils.encodeTargetTypeHR(targetType),
						e1: gorilla.stimuliURL(examples[0]),
						e2: gorilla.stimuliURL(examples[1]),
						e3: gorilla.stimuliURL(examples[2]),
						e4: gorilla.stimuliURL(examples[3]),
						imSize: exampleImSize
					// }); // end populate
					}, (err) => {
						$('#gorilla').show();
						// gorilla.refreshLayout();
						// $(document).one('keypress', (event: JQueryEventObject) => {
						$('#start-button').one('click', (event: JQueryEventObject) => {
							// $(document).off('keypress');
							machine.transition(State.Trial, blockStruct);
						}) // end on keypress
					}); // end populate and load
				}
				else {
					// $('.std-block').hide();
					// gorilla.refreshLayout();
					gorilla.populateAndLoad($('#gorilla'), 'std-block-instructions', {
					// gorilla.populate('#gorilla', 'std-block-instructions', {
					    blockCounter: blockCounter,
					    nBlocks: nBlocks,
						trialType: utils.encodeTargetTypeHR(targetType),
    					example: gorilla.stimuliURL(exampleImages[targetType]),
    					imSize: exampleImSize
					// }); // end populate
					}, (err) => {
						$('#gorilla').show();
						// gorilla.refreshLayout();
						// $(document).one('keypress', (event: JQueryEventObject) => {
						$('#start-button').one('click', (event: JQueryEventObject) => {
							// $(document).off('keypress');
							machine.transition(State.Trial, blockStruct);
						}) // end on keypress
					}); // end populateAndLoad
				} // end if (target type checking for variable display)
				
				// gorilla.refreshLayout();
				
				// $(document).one('keypress', (event: JQueryEventObject) => {
					// $(document).off('keypress');
					// machine.transition(State.Trial, blockStruct);
				// }) // end on keypress
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
			// ensure no keypress allowed
			keypressAllowed = false;
			
			console.log(blockStruct.blockArray);
			if (blockStruct.blockArray.length === 0) {
				machine.transition(State.Block);
			} else {
				// increment trial number
				trialNumber++;
				
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
				
				console.log("The random trial number is " + randTrial);
				console.log("If this number is not zero mod " + utils.moduloVal + " then it should be a target")
				if (randTrial % utils.moduloVal == 0) {
					// generate a list of 25 random distractors
					// Construct 25 random distractor urls
					const randomDistractors: string[] = utils.generateDistractorArray(utils.nImagesInGrid);
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
					const randomDistractors: string[] = utils.generateDistractorArray(utils.nImagesInGrid - 1);
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
					
					console.log("Target image from trial struct is " + trialStruct.targetImg);
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
		} // end onEnter
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
			
			console.log("Target image from info struct is " + informationStruct.trialStruct.targetImg);
			
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
						key:  key, // the response key for this trial
						correct:  informationStruct.trialStruct.correct, // boolean; whether correct or not
						response_time:  informationStruct.trialStruct.responseTime, // response time
						timed_out: informationStruct.trialStruct.timedOut,
						trial_array: informationStruct.trialStruct.humanReadableTrialArray,
					}); // end metric

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
					keypressAllowed = false;
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
						trial_array: informationStruct.trialStruct.humanReadableTrialArray,
					});// end metric
					
					$('#gorilla')
						.queue(function () {
							machine.transition(State.Trial, informationStruct.blockStruct);
							$(this).dequeue();
						}); // end queue for '#gorilla'
				})
				.run();
		} // end onEnter
	}) // end addState ImageArray
	
	SM.addState(State.Debrief, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'debrief', {
				debriefform: gorilla.resourceURL(debriefFilename)
			})
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Finish);
			}) // end on keypress
		}
	}) // end addState State.Consent

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
// 		SM.start(State.Instructions);
        SM.start(State.RequestFullscreen);
	}) // end gorilla run
}) // end gorilla ready
