/*--------------------------------------*/
// This is the main programme file that
// runs when the programme is started.
/*--------------------------------------*/

// API imports
import gorilla = require('gorilla/gorilla');
import stateMachine = require("gorilla/state_machine");
// our imports
import utils = require('utils');

/*--------------------------------------*/

// define some global variables
// var stimConditions: string[] = ['C', 'F', 'HF', 'LF'];
// const presentResponseKey: string = 'k'
// const absentResponseKey: string = 'l'
// const beforeFixationDelay: number = 500;
// const fixationLength: number = 500;
// const afterFixationDelay: number = 0;
// const rawPresentationTime: number = 8000; // previously 5000
// const presentationTime: number = rawPresentationTime + beforeFixationDelay + fixationLength + afterFixationDelay;
// // const presentationTime: number = rawPresentationTime;
// const timeoutMessageLength: number = 1000;
// const practiceFeedbackMessageLength: number = 1000;
// const exampleImSize: string = "3cm"; // e.g., example images will be 3cm × 3cm
// const consentFilename: string = "PareidoliaVisualSearch_InfoSheet.pdf"; // these are in the Resources tab
// const debriefFilename: string = "PareidoliaVisualSearch_Debriefing.pdf";
//
// const exampleImages: Object = {
//     'C': ['EC1.png', 'EC2.png', 'EC3.png'],
//     'F': ['EF1.png', 'EF2.png', 'EF3.png'],
//     'P': ['P1.png', 'P2.png', 'P3.png', 'P4.png', 'P5.png', 'P6.png'], // practice
// 	'E': ['EC.png', 'EF.png', 'EP.png'], // example
//     'HF': ['EP1.png', 'EP2.png', 'EP3.png'], // pareidolia example
//     'LF': ['EP1.png', 'EP2.png', 'EP3.png']
// };

const nPareidoliaTargets: number = 26; // 108
const nInImageSequence: number = 20; // i.e., 20 images are displayed in the trial
var blockTypes: string[] = ['F', 'P', 'O']; // face, pareidolia, objects
const stimExt: string = 'png';
const nDistractors: number = 100; // 400

/* ------------------------------------- */
// There is not much that you should need
// to change below this line!
/*--------------------------------------*/

const nT2Displayed: number = Math.floor(nPareidoliaTargets / blockTypes.length);
const nT1Images: number = Math.floor((2 / 3) * nPareidoliaTargets); // e.g., 72 = (2/3) * 108
// const nT2Images: number = Math.floor((1 / 3) * nPareidoliaTargets);
const nT2Images: number = nPareidoliaTargets - nT1Images; // e.g., 36 = (1/3) * 108 = 108 - 72
const constBlockTypes: string[] = [...blockTypes];
const nT2ImagesInSubBlock: number = Math.floor(nT2Images / 3); // e.g., 12 = ((1/3) * 108) / 3

// this will change
// var t2RemainingInBlock: number[] = [];
// export function constructNumberArray(lower: number, upper: number) {
//     var arr: number[] = [];
//     for (var i: number = lower; i <= upper; i++) {
//         arr.push(i)
//     }
//     return arr;
// }

// Given an array of stimuli names, constructs an array
// of stimuli URLs
function constructURLArray(stimArr: string[]) {
    var URLs: string[] = [];
	for (var i: number = 0; i < stimArr.length; i++) {
		const URL: string = gorilla.stimuliURL(stimArr[i]);
		URLs.push(URL);
	}

	return URLs;
}


// initialise number array for main target variables as globad
var allFaceURLs: string[];
var allObjectURLs: string[];
var allPareidoliaURLs: string[];

// initialise URL array of all distractors as global
var allDistractorURLs: string[];

// we choose numbers from here to determine the gap if T2 is shown
// var allStimNumberArray: number[] = utils.constructNumberArray(1, nPareidoliaTargets); // 108 = 12 * 3 * 3

// possible states in state machine
enum State {
	// Consent,
	// RequestFullscreen,
	// Demographics,
	// Instructions,
	// PracticeInstructions,
	// PracticeTrial,
	// PracticeFixationCross,
	// PracticeImageArray,
	// AfterPracticeInstructions,
	// Trial,
	// FixationCross,
	// ImageArray,
	BlockInitialiser,
	Block,
	Trial,
	// Debrief,
	Finish,
}

// our TrialStruct struct, which contains information
// about a trial, to be passed to different states
// interface TrialStruct {
// 	trialArray: string[],
	// humanReadableTrialArray: string[],
	// trialCondition: string,
	// isPresent: boolean,
	// isPresentString: string,
	// targetConditionCoded: number,
	// targetImg: string,
	// targetLocation: number,
	// key: string,
	// correct: number,
	// responseTime: number,
	// timedOut: boolean,
// }

// As above, for different blocks
interface BlockStruct {
	blockType: string,
	// t2DisplayPotentialArray: number[],
	// possibleT2TypeArray: number[],
	t1TargetURLsArray: string[],
	t2DisplayPotentialArray: number[],
	t2DisplayGapOptions: number[],
	t2TargetURLsArray: string[],
	// t2RemainingInBlock: number[],
    // targetType: string,
    // blockArray: number[],
    // possibleTrialTargets: number[],
    // possibleTrialPositions: number[],
}

// An interface to contain the above two
// interfaces
// interface InformationStruct {
// 	trialStruct: TrialStruct,
// 	blockStruct: BlockStruct
// }

// interface PracticeTrialStruct {
// 	practiceTargets: string[],
// 	practiceArrays: number[],
// 	practiceTarget: string,
// 	isPresent: boolean,
// 	practiceTargetPositions: number[],
// 	practiceArray: string[]
// }

// global boolean variable which we update in order to check
// if we are allowed to press the response key or not
// var keypressAllowed: boolean = false;

// const nTargets: number = 108;
// const nPerBlock: number = nTargets / 3;

// set trial number
// var trialNumber: number = 0;

// set absent counter
// var absentCount: number = 0;

// block counter and number of blocks for block title
// var blockCounter: number = 0;
// const nBlocks: number = stimConditions.length;

// need demographics to be global
var participantID: string;
var participantGender: string;
var participantAge: number;

// get keycode for response keys
// const presentResponseKeyCode: number = presentResponseKey.toLowerCase().charCodeAt(0);
// const absentResponseKeyCode: number = absentResponseKey.toLowerCase().charCodeAt(0);

// this is the main gorilla function call!
gorilla.ready(function(){
    // initialise stopwatch
    gorilla.initialiseTimer();
	
	//// INITIALISE URL LISTS BEFORE TASK BEGINS
	// set number array for main target variables
	const allFacesAsNumbers: number[] = utils.constructNumberArray(1, nPareidoliaTargets);
	const allObjectsAsNumbers: number[] = utils.constructNumberArray(1, nPareidoliaTargets);
	const allPareidoliaAsNumbers: number[] = utils.constructNumberArray(1, nPareidoliaTargets);
	// construct array of T2 images
	const allFaceNames: string[] = utils.constructNameArray(allFacesAsNumbers, 'F', '.' + stimExt);
	const allObjectNames: string[] = utils.constructNameArray(allObjectsAsNumbers, 'P', '.' + stimExt);
	const allPareidoliaNames: string[] = utils.constructNameArray(allPareidoliaAsNumbers, 'O', '.' + stimExt);
	// convert to URLs
	allFaceURLs = constructURLArray(allFaceNames);
	allObjectURLs = constructURLArray(allObjectNames);
	allPareidoliaURLs = constructURLArray(allPareidoliaNames);
	
	// set URL array of all distractors
	const allDistractorNumbers: number[] = utils.constructNumberArray(1, nDistractors);
	const allDistractorNames: string[] = utils.constructNameArray(allDistractorNumbers, 'D', '.' + stimExt)
	allDistractorURLs = constructURLArray(allDistractorNames);
	
	// console.log(allDistractorNames);
	
	// initialise state machine
	var SM = new stateMachine.StateMachine();
	
	// start at trial one
	// var trial_number: number = gorilla.retrieve('trial_number', 1, true);
	
	/* // Commented out Consent state
	SM.addState(State.Consent, {
		onEnter: (machine: stateMachine.Machine) => {
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
	*/
	
	SM.addState(State.BlockInitialiser, {
		// this state constructs everything needed for a single block
		onEnter: (machine: stateMachine.Machine) => {
			// get variables based on block type (e.g., object, face, pareidolia)
			const blockType: string = utils.takeRand(blockTypes); // remove a random element from the blockTypes array
			var t1TargetsNumberArray: number[] = [];
			switch (blockType) {
				case 'F':
					t1TargetsNumberArray = utils.takeNRand(allFacesAsNumbers, nT1Images);
				case 'P':
					t1TargetsNumberArray = utils.takeNRand(allPareidoliaAsNumbers, nT1Images);;
				case 'O':
					t1TargetsNumberArray = utils.takeNRand(allObjectsAsNumbers, nT1Images);;
			}
			
			// var possibleT2TypeArray: number[] = utils.constructNumberArray(1, nT2Displayed);
			var t2DisplayPotentialArray: number[] = utils.constructNumberArray(1, nT1Images);
			var t2DisplayGapOptions: number[] = utils.constructNumberArray(1, nT2Images);
			// var t2DisplayPotentialArray: number[] = [...allStimNumberArray]; // copy the allStimNumberArray trial (1--108)
			
			// var allStimNumberArray: number[] = utils.constructNumberArray(1, nPareidoliaTargets);
			// var t1TargetsNumberArray: number[] = utils.takeNRand(allStimNumberArray, nT1Images);
			// var t2RemainingInBlock: number[] = [...allStimNumberArray]; // remaining trials (36 = 108 * (1/3))

			// construct array of image names
			var t1TargetNamesArray: string[] = utils.constructNameArray(t1TargetsNumberArray, blockType, '.' + stimExt);
			// var t2TargetNamesArray: string[] = utils.constructNameArray(t2TargetsNumberArray, blockType, '.' + stimExt);

			// convert *NamesArrays to gorilla URLs
			var t1TargetURLsArray: string[] = constructURLArray(t1TargetNamesArray);
			// t2RemainingInBlock = constructURLArray(t2TargetNamesArray);
			
			// construct array of T2 images
			const t2SubBlock1URLs: string[] = utils.takeNRand(allFaceURLs, nT2ImagesInSubBlock);
			const t2SubBlock2URLs: string[] = utils.takeNRand(allObjectURLs, nT2ImagesInSubBlock);
			const t2SubBlock3URLs: string[] = utils.takeNRand(allPareidoliaURLs, nT2ImagesInSubBlock);
			// const t2SubBlock1Names: string[] = utils.constructNameArray(t2SubBlock1, 'F', '.' + stimExt);
			// const t2SubBlock2Names: string[] = utils.constructNameArray(t2SubBlock2, 'P', '.' + stimExt);
			// const t2SubBlock3Names: string[] = utils.constructNameArray(t2SubBlock3, 'O', '.' + stimExt);
			// concat and convert to URLs
			const t2TargetURLsArray: string[] = [...t2SubBlock1URLs, ...t2SubBlock2URLs, ...t2SubBlock3URLs];
			
			let blockStruct = {
				blockType: blockType,
				// t2DisplayPotentialArray: t2DisplayPotentialArray,
				// possibleT2TypeArray: possibleT2TypeArray,
				// t1TargetsArray: t1TargetsArray,
				// t2RemainingInBlock: t2RemainingInBlock,
				// t2DisplayPotentialArray: number[],
				// possibleT2TypeArray: number[],
				t1TargetURLsArray: t1TargetURLsArray,
				t2DisplayPotentialArray: t2DisplayPotentialArray,
				t2DisplayGapOptions: t2DisplayGapOptions,
				t2TargetURLsArray: t2TargetURLsArray,
				// t2TargetsArray: t2TargetsArray,
			} as BlockStruct
			
			machine.transition(State.Block, blockStruct);
		}, // end onEnter State.BlockInitialiser
		// onExit: () => {}
	}) // end addState State.BlockInitialiser
	
	SM.addState(State.Block, {
		// this state determines whether or not to go to the next block, do another trial, or finish
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			if (blockStruct.t1TargetURLsArray.length === 0 && blockStruct.t2DisplayGapOptions.length === 0 && blockStruct.t2TargetURLsArray.length === 0) {
				/// then our block is over
				if (blockTypes.length === 0 && allFacesAsNumbers.length == 0 && allPareidoliaAsNumbers.length == 0 && allObjectsAsNumbers.length == 0) {
					// if there are no other blocks remaining, finish
					machine.transition(State.Finish)
				} else {
					// otherwise, initialise another block
					machine.transition(State.BlockInitialiser)
				}
			} else {
				// if our trial is not over yet, continue
				machine.transition(State.Trial, blockStruct)
				
			}
		}, // end onEnter State.Block
		// onExit: () => {}
	}) // end addState State.Block
	
	SM.addState(State.Trial, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			// pull variables from blockStruct
			// const blockType: string = blockStruct.blockType
			// var t2DisplayPotentialArray: number[] = blockStruct.t2DisplayPotentialArray
			// var possibleT2TypeArray: number[] = blockStruct.possibleT2TypeArray
			
			// initialise distractor array
			var trialArrayURLs: string[] = [];
			
			// choose T1 URL
			const t1ImageURL: string = utils.takeRand(blockStruct.t1TargetURLsArray);
			console.log("T1 image has been chosen: " + t1ImageURL);
			console.log("T1 image possibilities left are" + blockStruct.t1TargetURLsArray);
			
			// choose whether or not T2 is displayed
			const t2DeterministicNumber: number = utils.takeRand(blockStruct.t2DisplayPotentialArray)
			if (t2DeterministicNumber % 2 == 0) {
				// do not display T2
				console.log("T2 image is not being displayed");
				// construct random distractor array
				trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 1);
				const randomInsertIndex: number = utils.randInt(0, nInImageSequence - 1);
				// insert T1 into trial array
				utils.insert(trialArrayURLs, randomInsertIndex, t1ImageURL);
			} else {
				// display T2; more complex choices to make (what T2 is)
				const t2ImageURL: string = utils.takeRand(blockStruct.t2TargetURLsArray);
				console.log("We are going to display T2");
				console.log("T2 image has been chosen: " + t2ImageURL);
				console.log("T2 image possibilities left are " + blockStruct.t2TargetURLsArray);
				// construct random distractor array
				trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 2);
				
				// choose T2 image gap
				// const t2ImageTypeNumber: number = utils.takeRand(blockStruct.t2DisplayPotentialArray);
				const t2ImageTypeNumber: number = utils.takeRand(blockStruct.t2DisplayGapOptions);
				var t2PosGap: number;
				console.log('Image number type is' + (t2ImageTypeNumber % 3));
				const t2ImageTypeNumberModulo: number = t2ImageTypeNumber % 3
				// switch (t2ImageTypeNumber % 3) {
			    //     case 0:
			    //         t2PosGap = 1;
			    //     case 1:
			    //         t2PosGap = 3;
			    //     case 2:
			    //         t2PosGap = 7;
			    // }
				if (t2ImageTypeNumberModulo == 0) {
					t2PosGap = 1;
				} else if (t2ImageTypeNumberModulo == 1) {
					t2PosGap = 3;
				} else {
					t2PosGap = 7;
				}
				console.log('So image gap is' + t2PosGap);
				
				const trialArrayT1MaxPos: number = nInImageSequence - t2PosGap;
				const randomInsertIndex: number = utils.randInt(0, trialArrayT1MaxPos - 1);
				// insert T1 into trial array
				utils.insert(trialArrayURLs, randomInsertIndex, t1ImageURL);
				// insert T2 into trial array
				utils.insert(trialArrayURLs, randomInsertIndex + t2PosGap, t2ImageURL);
			}
			
			console.log("T2 display potential left are: " + blockStruct.t2DisplayPotentialArray);
			
			// populate our trial screen
			gorilla.populate('#gorilla', 'trial', {
				trials: trialArrayURLs,
			});
			// $('.trial-array').show()
			gorilla.refreshLayout();
			$('#next-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Block, blockStruct);
			})
			
			
			// gorilla.populateAndLoad($('#gorilla'), 'trial', {
			// 	trials: trialArrayURLs,
			// }, (err) => {
			// 	machine.transition(State.Block, blockStruct);
			// }) // end populate and load
		}, // end onEnter State.Trial
		// onExit: () => {
		// 	machine.transition(State.Block, blockStruct);
		// } // end onExit State.Trial
	}) // end addState State.Trial
	
	/* // Commented out Request Full Screen state
	SM.addState(State.RequestFullscreen, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'request-fs', {})
			gorilla.refreshLayout();
			$('#fs-button').one('click', (event: JQueryEventObject) => {
			    if(!utils.isFullscreen()){
                    utils.launchIntoFullscreen(document.documentElement);
                }
				machine.transition(State.Demographics);
			}) // end on keypress
			$(document).one('keypress', (event: JQueryEventObject) => {
			    if(!utils.isFullscreen()){
                    utils.launchIntoFullscreen(document.documentElement);
                }
				machine.transition(State.Demographics);
			}) // end on keypress
		} // end onEnter
	}) // end addState State.Consent
	*/
	
	/* // Commented out Demographics state
	SM.addState(State.Demographics, {
		onEnter: (machine: stateMachine.Machine) => {
			// need to turn off keypress handler for the time being
			// so that the demographics page doesn't unexpectedly
			// update when we write out name &c.
			$(document).off('keypress');
			
			$('.incomplete-message').hide();
			$('.invalid-age').hide();
			gorilla.refreshLayout();
			gorilla.populate('#gorilla', 'demographics', {})
				
			$('#next-button').on('click', (event: JQueryEventObject) => {
				participantGender = (<HTMLInputElement>document.getElementById("gender")).value;
				participantID = (<HTMLInputElement>document.getElementById("PID")).value;
				var rawAge = (<HTMLInputElement>document.getElementById("age")).value;
				
				if (participantID == "" || rawAge == "" || participantGender === "undef") {
					$('.invalid-age').hide();
					$('.incomplete-message').show();
				} else {
					var intAge = parseInt(rawAge);
					if (isNaN(intAge)) {
						// tell them to enter a valid age
						$('.incomplete-message').hide();
						$('.invalid-age').show();
					} else {
						// we have a valid integer and it's chill
						$('.invalid-age').hide();
						$('.incomplete-message').hide();
						participantAge = intAge;
						machine.transition(State.Instructions);
					}
				}
			}) // end on click
		} // end onEnter
	}) // end addState State.Demographics
	*/

	/* // Commented out Instructions state
	// In this state we will display our instructions for the task
	SM.addState(State.Instructions, {
	    onEnter: (machine: stateMachine.Machine) => {
			const randExampleFace: string = utils.randVal(exampleImages['F']);
			const randExamplePareidolia: string = utils.randVal(exampleImages['HF']);
	        const randExampleCar: string = utils.randVal(exampleImages['C']);
            const randExampleImages: string[] = [randExampleFace, randExamplePareidolia, randExampleCar];
	        const examples: string[] = constructURLArray(randExampleImages);
			$('#gorilla').hide();
	        gorilla.populateAndLoad($('#gorilla'), 'instructions', {
	            e1: examples[0],
	            e2: examples[1],
	            e3: examples[2],
				responseTimeAllowed: rawPresentationTime/1000,
	            imSize: exampleImSize,
				responsePresent: presentResponseKey.toUpperCase(),
				responseAbsent: absentResponseKey.toUpperCase(),
	        },
	        (err) => {
				$('#gorilla').show();
				$('#start-button').one('click', (event: JQueryEventObject) => {
					// transition to the practice trials
					machine.transition(State.PracticeInstructions);
				}) // end on click start button
	        }); // end populate and load
	    } // end onEnter
	}) // end addState Instructions
	*/
	
	/* // Commented out all Practice* states
	SM.addState(State.PracticeInstructions, {
	    onEnter: (machine: stateMachine.Machine) => {
			var examples: string[] = constructURLArray(exampleImages['P']);
			$('#gorilla').hide();
	        gorilla.populateAndLoad($('#gorilla'), 'practice-instructions', {
				example: gorilla.stimuliURL(utils.randVal(utils.generatePracticeArray())),
				imSize: exampleImSize
		   	}, (err) => {
				$('#gorilla').show();
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
	        
			// if the practice trials are over, transition to post-practice instructions
	        if (practiceStruct.practiceArrays.length === 0) {
	            machine.transition(State.AfterPracticeInstructions);
	        } else {
	            var trialArray: string[] = [];
	            const randTrial: number = utils.takeRand(practiceStruct.practiceArrays);
				
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
	                
					// update metrics
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
	            gorilla.populateAndLoad($('#gorilla'), 'trial', {
					trials: practiceStruct.practiceArray,
					responsePresent: presentResponseKey.toUpperCase(),
					responseAbsent: absentResponseKey.toUpperCase(),
				}, (err) => {
	                machine.transition(State.PracticeFixationCross, practiceStruct);
	            }) // end populate and load
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
			
	        machine.transition(State.PracticeImageArray, practiceStruct);
	    }, // end onEnter
	}) // end addState for FixationCross

	SM.addState(State.PracticeImageArray, {
	    onEnter: (machine: stateMachine.Machine, practiceStruct: PracticeTrialStruct) => {
	        // initialise sequence for timeout
			var stateTimer: gorilla.GorillaTimerSequence;
	        
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
	            // exit the keypress event if we are not allowed to!
	            if (!keypressAllowed) return;
	            
	            // get the key that was pressed
	            const e = event.which;
	            
	            // enter state where it can't enter any more keys
	            if (e === presentResponseKeyCode || e === absentResponseKeyCode) {
	                // stop timout timer!
	                stateTimer.cancel();
	                
	                // update keypress as we have just pressed the key!
	                keypressAllowed = false;
	                
	                // check if key press was correct
	                if ((practiceStruct.isPresent && e === presentResponseKeyCode) || (!practiceStruct.isPresent && e === absentResponseKeyCode)) {
	                   // correct!
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
	                    // incorrect response
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
	            } // end checking if key pressed is K or L
	        }) // end response keypress
	        
			// Timeout if took too long!
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
	*/
	
	
	/* // Comment out all main block states
	SM.addState(State.Block, {
	    onEnter: (machine: stateMachine.Machine) => {
			// upon entering the block after the final trial condition
			// we are duly finished and we need to immediately transition
			// to the finish state
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
				
				// populate our trial screen
				$('#gorilla').hide();
				const examples: string[] = utils.shuffle(exampleImages[targetType]);
				gorilla.populateAndLoad($('#gorilla'), 'block-instructions', {
				    blockCounter: blockCounter,
				    nBlocks: nBlocks,
					trialType: utils.encodeTargetTypeHR(targetType),
					e1: gorilla.stimuliURL(examples[0]),
					e2: gorilla.stimuliURL(examples[1]),
					e3: gorilla.stimuliURL(examples[2]),
					imSize: exampleImSize
				}, (err) => {
					$('#gorilla').show();
					$('#start-button').one('click', (event: JQueryEventObject) => {
						machine.transition(State.Trial, blockStruct);
					}) // end on keypress
				}); // end populate and load
			} // end if
	    } // end onEnter
	}); // end add state Block
	
	// in this state, an array of images will be displayed and a response button
	// will be pressed
	SM.addState(State.Trial, {
		// the onEnter functions is executed when a state is entered
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			// ensure no keypress allowed
			keypressAllowed = false;
			
			// stop trial if we have finished all blocks!
			if (blockStruct.blockArray.length === 0) {
				machine.transition(State.Block);
			} else {
				// increment trial number
				trialNumber++;
				
				var trialArray: string[] = [];
				const randTrial: number = utils.takeRand(blockStruct.blockArray);
				
				// some metrics for later
				const condType = utils.encodeTargetType(blockStruct.targetType);
				const blockCode: number = utils.getCondCode(blockStruct.targetType);
				
				// initialise trialStruct for this trial
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
				} as TrialStruct;
				
				// if the random trial number is zero modulo some value,
				// then it should be a distractor.  This modulo value is defined
				// in utils, based on the proportion of trials you need
				if (randTrial % utils.moduloVal == 0) {
				    // increment absent counter
				    absentCount++;
					// Construct 25 random distractor urls
					const randomDistractors: string[] = utils.generateDistractorArray(utils.nImagesInGrid);
					const randomDistractorURLs: string[] = constructURLArray(randomDistractors);

					// update trialArray with array of distractors
					trialStruct.trialArray = randomDistractorURLs;
				    
				    // update metrics
				    trialStruct.humanReadableTrialArray = randomDistractors;
					trialStruct.isPresent = false;
					trialStruct.isPresentString = 'absent';
					trialStruct.targetImg = 'absent' + absentCount;
				} else {
					// Construct 24 random distractor urls
					const randomDistractors: string[] = utils.generateDistractorArray(utils.nImagesInGrid - 1);
					const randomURLs: string[] = constructURLArray(randomDistractors);

					// choose a random image from the possible image set.  This image cannot be repeated
					const randomImageNumber: number = utils.takeRand(blockStruct.possibleTrialTargets) + 1; // add one because array is from 0:24
					const conditionImage: string = utils.constructStimName(blockStruct.targetType, randomImageNumber);
					const conditionImageURL: string = gorilla.stimuliURL(conditionImage);
					
					// insert image at random position.  This position cannot be repeated
					const randPosition: number = utils.takeRand(blockStruct.possibleTrialPositions);
					utils.insert(randomURLs, randPosition, conditionImageURL)
					
					// update metrics
					trialStruct.trialArray = randomURLs;
					trialStruct.humanReadableTrialArray = utils.insert(randomDistractors, randPosition, conditionImage);
					trialStruct.targetImg = conditionImage;
					trialStruct.isPresent = true;
					trialStruct.isPresentString = 'present';
					trialStruct.targetLocation = randPosition;
				} // end if

				// package all needed data into an information struct
				// for passing to different states.  Wrap this interface
				// in wrapping paper and put a bow on it
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
				gorilla.populateAndLoad($('#gorilla'), 'trial', {
					trials: trialStruct.trialArray,
					responsePresent: presentResponseKey.toUpperCase(),
					responseAbsent: absentResponseKey.toUpperCase(),
				}, (err) => {
					machine.transition(State.FixationCross, informationStruct);
				}) // end populate and load
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
			machine.transition(State.ImageArray, informationStruct);
		} // end onEnter
	}) // end addState for FixationCross
	
	SM.addState(State.ImageArray, {
		onEnter: (machine: stateMachine.Machine, informationStruct: InformationStruct) => {
			// initialise sequence for timeout
			var stateTimer: gorilla.GorillaTimerSequence;
			
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
				if (e === presentResponseKeyCode || e === absentResponseKeyCode) {
					gorilla.stopStopwatch();
					
					// IMPORTANT: get response time!
					// This is the main metric!
					informationStruct.trialStruct.responseTime = gorilla.getStopwatch();
					
					// stop timout timer
					stateTimer.cancel();
					
					// update keypress as we have just pressed the key!
					keypressAllowed = false;
					
					// get string of key pressed from character code
					var key = String.fromCharCode(e);
					
					// check if key press was correct
					if ((informationStruct.trialStruct.isPresent && e === presentResponseKeyCode) || (!informationStruct.trialStruct.isPresent && e === absentResponseKeyCode)) {
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
						age: participantAge,
						id: participantID,
						gender: participantGender,
					}); // end metric

					// move on transition
					$('#gorilla')
						.queue(function () {
							machine.transition(State.Trial, informationStruct.blockStruct);
							$(this).dequeue();
						}); // end queue for '#gorilla'
				} // end checking if key pressed is 75:76 (K or L)
			}) // end response keypress
			
			// timeout!
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
						age: participantAge,
						id: participantID,
						gender: participantGender,
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
	/*
	
	/* // Commented out Debrief state
	SM.addState(State.Debrief, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'debrief', {
				debriefform: gorilla.resourceURL(debriefFilename)
			});
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Finish);
			}) // end on keypress
		}
	}) // end addState State.Consent
	*/

	// this is the state we enter when we have finished the task
	SM.addState(State.Finish, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'finish', {});
			gorilla.refreshLayout();
			$('#next-button').one('click', (event: JQueryEventObject) => {
				gorilla.finish();
			})
		} // end onEnter
	}) // end addState Finish

	// calling this function starts gorilla and the task as a whole
	gorilla.run(function () {
        SM.start(State.BlockInitialiser);
	}) // end gorilla run
}) // end gorilla ready
