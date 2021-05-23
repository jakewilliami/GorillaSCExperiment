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

const nPareidoliaTargets: number = 36; // 108
const nInImageSequence: number = 20; // i.e., 20 images are displayed in the trial
var blockTypes: string[] = ['F', 'P', 'O']; // face, pareidolia, objects
const stimExt: string = 'png';
const nDistractors: number = 100; // 400
const beforeFixationDelay: number = 500;
const fixationLength: number = 500;
const afterFixationDelay: number = 0;
const imageDisplayLength: number = 70;
var trialCounter: number = 0;

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

// possible states in state machine
enum State {
	Instructions,
	BlockInitialiser,
	Block,
	Trial,
	FixationCross,
	SubTrial,
	Response,
	Finish,
}

// As above, for different blocks
interface BlockStruct {
	blockType: string,
	t1TargetURLsArray: string[],
	t2DisplayPotentialArray: number[],
	t2DisplayGapOptions: number[],
	t2TargetURLsArray: string[],
	trialArrayURLs: string[],
}

// need demographics to be global
var participantID: string;
var participantGender: string;
var participantAge: number;

// this is the main gorilla function call!
gorilla.ready(function(){
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
	
	// initialise stopwatch
    gorilla.initialiseTimer();
	
	// initialise state machine
	var SM = new stateMachine.StateMachine();
	
	// In this state we will display our instructions for the task
	SM.addState(State.Instructions, {
	    onEnter: (machine: stateMachine.Machine) => {
			$('#gorilla').hide();
	        gorilla.populateAndLoad($('#gorilla'), 'instructions', {
	            
	        },
	        (err) => {
				$('#gorilla').show();
				$('#start-button').one('click', (event: JQueryEventObject) => {
					// transition to the practice trials
					machine.transition(State.BlockInitialiser);
				}) // end on click start button
	        }); // end populate and load
	    } // end onEnter
	}) // end addState Instructions
	
	SM.addState(State.BlockInitialiser, {
		// this state constructs everything needed for a single block
		onEnter: (machine: stateMachine.Machine) => {
			// get variables based on block type (e.g., object, face, pareidolia)
			const blockType: string = utils.takeRand(blockTypes); // remove a random element from the blockTypes array
			var t1TargetURLsArray: string[] = [];
			if (blockType == 'F') {
				t1TargetURLsArray = utils.takeNRand(allFaceURLs, nT1Images);
			} else if (blockType == 'P') {
				t1TargetURLsArray = utils.takeNRand(allPareidoliaURLs, nT1Images);
			} else { // blockType == 'O'
				t1TargetURLsArray = utils.takeNRand(allObjectURLs, nT1Images);
			};
			
			var t2DisplayPotentialArray: number[] = utils.constructNumberArray(1, nT1Images); // whether or not T2 is displayed
			var t2DisplayGapOptions: number[] = utils.constructNumberArray(1, nT2Images);
			
			// construct array of T2 images
			const t2SubBlock1URLs: string[] = utils.takeNRand(allFaceURLs, nT2ImagesInSubBlock);
			const t2SubBlock2URLs: string[] = utils.takeNRand(allObjectURLs, nT2ImagesInSubBlock);
			const t2SubBlock3URLs: string[] = utils.takeNRand(allPareidoliaURLs, nT2ImagesInSubBlock);
			
			const t2TargetURLsArray: string[] = [...t2SubBlock1URLs, ...t2SubBlock2URLs, ...t2SubBlock3URLs];
			
			let blockStruct = {
				blockType: blockType,
				t1TargetURLsArray: t1TargetURLsArray,
				t2DisplayPotentialArray: t2DisplayPotentialArray,
				t2DisplayGapOptions: t2DisplayGapOptions,
				t2TargetURLsArray: t2TargetURLsArray,
				trialArrayURLs: [],
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
				if (blockTypes.length === 0 && allFaceURLs.length == 0 && allObjectURLs.length == 0 && allPareidoliaURLs.length == 0) {
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
				
				if (t2ImageTypeNumberModulo == 0) {
					t2PosGap = 1;
				} else if (t2ImageTypeNumberModulo == 1) {
					t2PosGap = 3;
				} else { // t2ImageTypeNumberModulo == 2
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
			
			// update blockStruct to have correct trial array
			blockStruct.trialArrayURLs = trialArrayURLs;
			
			
			// hide the display till the images are loaded
			// $('.trial-image').hide();
			// $('.instruction').hide();
			// $('.timeout-feedback').hide();
			// $('.practice-feedback-correct').hide();
            // $('.practice-feedback-incorrect').hide();
			
			// populate our trial screen
			// gorilla.populateAndLoad($('#gorilla'), 'trial', {
			// 	thistrial: trialStruct.trialArray,
			// 	// responsePresent: presentResponseKey.toUpperCase(),
			// 	// responseAbsent: absentResponseKey.toUpperCase(),
			// }, (err) => {
			// $('.trial-image').hide();
			// gorilla.populateAndLoad($('#gorilla'), 'trial')
			// $('.fixation-cross').hide();
			// $('.trial-image').hide();
			// gorilla.populateAndLoad($('#gorilla'), 'subtrial', {
			// 	thistrial: '', // hbs file expects some input but we don't have the exact image yet
			// }, () => {
			machine.transition(State.FixationCross, blockStruct);
			// }); // end populateAndLoad
			// machine.transition(State.FixationCross, blockStruct);
			// }) // end populate and load
			
			// populate our trial screen
			// gorilla.populate('#gorilla', 'trial', {
			// 	trials: trialArrayURLs,
			// });
			// $('.trial-array').show()
			// gorilla.refreshLayout();
			// $('#next-button').one('click', (event: JQueryEventObject) => {
			// 	machine.transition(State.Block, blockStruct);
			// })
			
			
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
	
	SM.addState(State.FixationCross, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			// $('.fixation-cross').hide();
			// $('.trial-image').hide();
 			// $('.instruction').hide();
 			// $('.timeout-feedback').hide();
 			// $('.practice-feedback-correct').hide();
	        // $('.practice-feedback-incorrect').hide();
			// gorilla.populateAndLoad($('#gorilla'), 'fixation', {}, () => {
			// gorilla.populateAndLoad('#gorilla', 'fixation', {}, () => {});
			gorilla.populate('#gorilla', 'fixation', {});
			// $('.fixation-cross').hide();
			// gorilla.refreshLayout();
			console.log("Showing fixation cross for " + fixationLength / 1000 + " seconds");
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
				.delay(afterFixationDelay)
				.queue(function () {
					machine.transition(State.SubTrial, blockStruct);
					$(this).dequeue();
				});
			// machine.transition(State.SubTrial, blockStruct);
		// }) // end populateAndLoad
		} // end onEnter
	}) // end addState State.FixationCross
	
	SM.addState(State.SubTrial, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			console.log("We are in the sub-trial state, and we are now going to display the trial array: " + blockStruct.trialArrayURLs)
			
			if (blockStruct.trialArrayURLs.length === 0) {
				// then we need to initialise another trial!
				machine.transition(State.Response, blockStruct);
			} else {
				// then we need to start, or are still, looping through the trial array
				
				// choose the first, or next, image from the trial array
				// const thistrial: string = utils.takeFirst(blockStruct.trialArrayURLs);
				
				gorilla.populateAndLoad('#gorilla', 'subtrial', {thistrial: blockStruct.trialArrayURLs)},() => {
                    $('#gorilla')
					.queue(function (next) {
						$('.trial-image').css('visibility','visible'); // css('display', 'none')?
						next();
					}) // end queue for '#gorilla'
					.delay(imageDisplayLength)
					.queue(function (next) {
						// this queue isn't strictly necessary, as we loop through the SubTrial state, replacing the trial image
						$('.trial-image').css('visibility','hidden');
						next();
					}) // end queue for '#gorilla'
					.queue(function (next) {
						// once again, must be inside the queue or it will not display
						machine.transition(State.SubTrial, blockStruct);
						next();
					}) // end queue for '#gorilla'
                });
            } // end if
			
			// if (blockStruct.trialArrayURLs.length === 0) {
			// 	// then we need to initialise another trial!
			// 	machine.transition(State.Response, blockStruct);
			// } else {
				// then we need to start, or are still, looping through the trial array
				// $('.trial-image').hide();
				
				// choose the first, or next, image from the trial array
				// const thistrial: string = utils.takeFirst(blockStruct.trialArrayURLs);
				
				// $('.fixation-cross').hide();
				// $('.trial-image').hide();
				// trialCounter++;
				
				// gorilla.populateAndLoad($('#gorilla'), 'subtrial', {
					// thistrial: thistrial,
				// }, () => {
				// gorilla.populateAndLoad('#gorilla', 'subtrial', {
				// 	thistrial: thistrial,
				// }, () => {}); // end populate
				// while (true) {
				console.log("The maximum index of the trial array is " + (blockStruct.trialArrayURLs.length - 1));
				// $('#gorilla')
				// 	.queue(function () {
				// 		for (var i: number; i < (blockStruct.trialArrayURLs.length - 1); i++) {
				// 		// while (blockStruct.trialArrayURLs.length > 0) {
				// 			// const thistrial: string = utils.takeFirst(blockStruct.trialArrayURLs);
				// 			console.log("We are at trial " + (i + 1))
				// 			const thistrial: string = blockStruct.trialArrayURLs[i];
				// 			gorilla.populate('#gorilla', 'subtrial', {thistrial: thistrial});
				// 			// gorilla.refreshLayout();
				// 			$('#gorilla')
				// 				.queue(function () {
				// 					$('.trial-image').show();
				// 					gorilla.refreshLayout();
				// 					$(this).dequeue();
				// 				})
				// 				.delay(imageDisplayLength);
				//
				// 				// .queue(function () {
				// 				// 	if (blockStruct.trialArrayURLs.length === 0) {
				// 				// 		machine.transition(State.SubTrial, blockStruct);
				// 				// 		// break;
				// 				// 	}
				// 				// 	$(this).dequeue();
				// 				// })
				// 		} // end for
				// 		$(this).dequeue();
				// 	}) // end queue
				// 	.queue( function () {
				// 		machine.transition(State.Block, blockStruct);
				// 		$(this).dequeue();
				// 	})
				// machine.transition(State.Block, blockStruct);
				// $('.trial-image').hide();
				// gorilla.refreshLayout();
				// console.log("We are at trial counter " + trialCounter + " and we have chosen the image " + thistrial);
				
				// $('#gorilla')
				// 	.queue(function () {
				// 		$('.trial-image').show();
				// 		gorilla.refreshLayout();
				// 		$(this).dequeue();
				// 	}) // end queue for '#gorilla'
				// 	.delay(imageDisplayLength)
				// 	// .queue(function () {
				// 	// 	$('.trial-image').hide();
				// 	// 	gorilla.refreshLayout();
				// 	// 	$(this).dequeue();
				// 	// }) // end queue for '#gorilla'
				// 	.queue(function () {
				// 		machine.transition(State.SubTrial, blockStruct);
				// 		$(this).dequeue();
				// 	})
				// // machine.transition(State.SubTrial, blockStruct);
				
						
				// }) // end populateAndLoad
			// } // end if
		} // end onEnter
	}) // end addState State.SubTrial
	
	SM.addState(State.Response, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			gorilla.populateAndLoad($('#gorilla'), 'between-trials', {
				    // blockCounter: blockCounter,
				    // nBlocks: nBlocks,
					// trialType: utils.encodeTargetTypeHR(targetType),
					// e1: gorilla.stimuliURL(examples[0]),
					// e2: gorilla.stimuliURL(examples[1]),
					// e3: gorilla.stimuliURL(examples[2]),
					// imSize: exampleImSize
				}, (err) => {
					$('#gorilla').show();
					$('#start-button').one('click', (event: JQueryEventObject) => {
						machine.transition(State.Block, blockStruct);
					}) // end on keypress
				}); // end populate and load
		} // end onEnter
	}) // end addState State.Response

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
        SM.start(State.Instructions);
	}) // end gorilla run
}) // end gorilla ready
