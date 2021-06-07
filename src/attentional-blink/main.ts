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

const nT2ImagesPerBlock: number = 100; // 108
const nWatchImages: number = 100;
const nInImageSequence: number = 20; // i.e., 20 images are displayed in the trial
var blockTypes: string[] = ['F', 'P', 'O']; // face, pareidolia, objects (flowers)
const stimExt: string = 'png';
const nDistractors: number = 100; // 400
const beforeFixationDelay: number = 500;
const fixationLength: number = 500;
const afterFixationDelay: number = 0;
const imageDisplayLength: number = 200; // 70
var trialCounter: number = 0;
const presentResponseKey: string = 'k';
const absentResponseKey: string = 'l';
const digitalResponseKey: string = 'k';
const analogueResponseKey: string = 'l';

// 3 blocks, with constant T2 type

/* ------------------------------------- */
// There is not much that you should need
// to change below this line!
/*--------------------------------------*/

const nTrials: number = nT2ImagesPerBlock * 3 * 2; // 100 T2 images per block * 3 blocks * 2 trial types = 600
const nT2Displayed: number = Math.floor(nT2ImagesPerBlock / blockTypes.length);
// const nT1ImagesPerBlock: number = Math.floor((2 / 3) * nT2ImagesPerBlock); // e.g., 72 = (2/3) * 108
// const nT1ImagesPerBlock: number = nT2ImagesPerBlock * 3 * 2;
const nT1ImagesPerBlock: number = nT2ImagesPerBlock * 2; // 100 T2 images per block * 2 trial types = 200
// const nT2Images: number = Math.floor((1 / 3) * nT2ImagesPerBlock);
// const nT2Images: number = nT2ImagesPerBlock - nT1ImagesPerBlock; // e.g., 36 = (1/3) * 108 = 108 - 72
const constBlockTypes: string[] = [...blockTypes];
// const nT2ImagesInSubBlock: number = Math.floor(nT2Images / 3); // e.g., 12 = ((1/3) * 108) / 3
// const nSpecificWatches: number = Math.floor(nWatchImages / 2); // half of the watches are digital, the other half are analogue
const nSpecificWatches: number = Math.floor(nWatchImages / 2); // half of the watches are digital, the other half are analogue
const nSpecificWatchesPerBlock: number = nT2ImagesPerBlock * 2;

// global boolean variable which we update in order to check
// if we are allowed to press the response key or not
var keypressAllowed: boolean = false;

// get keycode for response keys
const presentResponseKeyCode: number = presentResponseKey.toLowerCase().charCodeAt(0);
const absentResponseKeyCode: number = absentResponseKey.toLowerCase().charCodeAt(0);
const digitalResponseKeyCode: number = digitalResponseKey.toLowerCase().charCodeAt(0);
const analogueResponseKeyCode: number = analogueResponseKey.toLowerCase().charCodeAt(0);


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

// initialise number array for main target variables as global
var allFaceURLs: string[];
var allObjectURLs: string[];
var allPareidoliaURLs: string[];
var allDigitalWatchURLs: string[];
var allAnalogueWatchURLs: string[];

// initialise URL array of all distractors as global
var allDistractorURLs: string[];

// possible states in state machine
enum State {
	PreloadStimuli,
	Instructions,
	BlockInitialiser,
	Block,
	PreTrial,
	FixationCross,
	Trial,
	// Response,
	WatchTypeResponse,
	T2SeenResponse,
	Finish,
}

// As above, for different blocks
interface BlockStruct {
	blockType: string,
	// t1TargetURLsArray: string[],
	digitalWatchURLsArray: string[],
	analogueWatchURLsArray: string[],
	t2DisplayPotentialArray: number[],
	t2DisplayGapOptions: number[],
	t2TargetURLsArray: string[],
	trialArrayURLs: string[],
	t2PosGap: number,
	t2Displayed: boolean,
	// watchType: number,
	isDigital: boolean,
	isAnalogue: boolean,
}

interface StimulusContainer {
	stimURL: string,
	globalIndex: number,
}

// need demographics to be global
var participantID: string;
var participantGender: string;
var participantAge: number;

// this is the main gorilla function call!
gorilla.ready(function(){
	//// INITIALISE URL LISTS BEFORE TASK BEGINS
	// set number array for main target variables
	const allFacesAsNumbers: number[] = utils.constructNumberArray(1, nT2ImagesPerBlock);
	const allObjectsAsNumbers: number[] = utils.constructNumberArray(1, nT2ImagesPerBlock);
	const allPareidoliaAsNumbers: number[] = utils.constructNumberArray(1, nT2ImagesPerBlock);
	const allDigitalWatchesAsNumbers: number[] = utils.constructNumberArray(1, nSpecificWatches)
	const allAnalogueWatchesAsNumbers: number[] = utils.constructNumberArray(1, nSpecificWatches)
	// construct array of T2 images
	const allFaceNames: string[] = utils.constructNameArray(allFacesAsNumbers, 'Face', '.' + stimExt);
	const allObjectNames: string[] = utils.constructNameArray(allObjectsAsNumbers, 'Flower', '.' + stimExt);
	const allPareidoliaNames: string[] = utils.constructNameArray(allPareidoliaAsNumbers, 'Pareidolia', '.' + stimExt);
	const allDigitalWatchNames: string[] = utils.constructNameArray(allDigitalWatchesAsNumbers, 'Digital', '.' + stimExt);
	const allAnalogueWatchNames: string[] = utils.constructNameArray(allAnalogueWatchesAsNumbers, 'Analogue', '.' + stimExt);
	// convert to URLs
	allFaceURLs = constructURLArray(allFaceNames);
	allObjectURLs = constructURLArray(allObjectNames);
	allPareidoliaURLs = constructURLArray(allPareidoliaNames);
	allDigitalWatchURLs = constructURLArray(allDigitalWatchNames);
	allAnalogueWatchURLs = constructURLArray(allAnalogueWatchNames);
	
	// set URL array of all distractors
	const allDistractorNumbers: number[] = utils.constructNumberArray(1, nDistractors);
	const allDistractorNames: string[] = utils.constructNameArray(allDistractorNumbers, 'D', '.' + stimExt)
	allDistractorURLs = constructURLArray(allDistractorNames);
	
	// construct a number array to help determine which type of watch to display
	var watchDisplayTypes: number[] = utils.constructNumberArray(1, nT1ImagesPerBlock);
	
	// An attempt at preloading all images at the start
	/*
	// initialise stimulus container arrays for each type of image
	var allFaceContainers: StimulusContainer[] = [];
	var allObjectContainers: StimulusContainer[] = [];
	var allPareidoliaContainers: StimulusContainer[] = [];
	var allDistractorContainers: StimulusContainer[] = [];
	
	// construct object for iterating over all image types
	let allImageURLsAndContainers: {URLs: string[], container: StimulusContainer[]}[] = [
		{URLs: allFaceURLs, container: allFaceContainers},
		{URLs: allObjectURLs, container: allObjectContainers},
		{URLs: allPareidoliaURLs, container: allPareidoliaContainers},
		{URLs: allDistractorURLs, container: allDistractorContainers},
	];
	
	var allImageContainers: StimulusContainer[] = [];
	
	var globalImageIndex = 0;
	for (var i: number; i < (allImageURLsAndContainers.length - 1); i++) {
		let URLs: string[] = allImageURLsAndContainers[i].URLs;
		let container: StimulusContainer[] = allImageURLsAndContainers[i].container;
		
		for (var j: number; j < (URLs.length - 1); j++) {
			let thisStimContainer = {
				stimURL: URLs[j],
				globalIndex: globalImageIndex,
			} as StimulusContainer
			
			container.push(thisStimContainer);
			allImageContainers.push(thisStimContainer)
			globalImageIndex++;
		}
	}
	
	console.log(allImageContainers);
	*/
		
	// initialise stopwatch
    gorilla.initialiseTimer();
	
	// initialise state machine
	var SM = new stateMachine.StateMachine();
	
	/*
	SM.addState(State.PreloadStimuli, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populateAndLoad('#gorilla', 'allstim', {stimulusarray: allImageContainers},() => {
				machine.transition(State.Instructions);
				// $().show();
			})
		} // end onEnter
	}) // end addState PreloadStimuli
	*/
	
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
			console.log("We have chosen block type " + blockType);
			
			// construct (potentially repeating; i.e., not unique) array of suffled digital/analogue watches
			const digitalWatchURLsArray: string[] = utils.chooseNRand(allDigitalWatchURLs, nSpecificWatchesPerBlock);
			const analogueWatchURLsArray: string[] = utils.chooseNRand(allAnalogueWatchURLs, nSpecificWatchesPerBlock);
			// var t1TargetURLsArray: string[] = [...digitalWatchURLsArray, ...analogueWatchURLsArray];
			// utils.shuffle(t1TargetURLsArray);
			
			// construct tT array
			var t2TargetURLsArray: string[] = [];
			if (blockType == 'F') {
				t2TargetURLsArray = utils.takeNRand(allFaceURLs, nT2ImagesPerBlock);
			} else if (blockType == 'P') {
				t2TargetURLsArray = utils.takeNRand(allPareidoliaURLs, nT2ImagesPerBlock);
			} else { // blockType == 'O'
				t2TargetURLsArray = utils.takeNRand(allObjectURLs, nT2ImagesPerBlock);
			};
			console.log("The random second target images we have in this block is: " + t2TargetURLsArray);
			
			var t2DisplayPotentialArray: number[] = utils.constructNumberArray(1, nT2ImagesPerBlock); // whether or not T2 is displayed
			var t2DisplayGapOptions: number[] = utils.constructNumberArray(1, nT2ImagesPerBlock);
			
			/*
			// construct array of T2 images
			const t2SubBlock1URLs: string[] = utils.takeNRand(allFaceURLs, nT2ImagesInSubBlock);
			const t2SubBlock2URLs: string[] = utils.takeNRand(allObjectURLs, nT2ImagesInSubBlock);
			const t2SubBlock3URLs: string[] = utils.takeNRand(allPareidoliaURLs, nT2ImagesInSubBlock);
			
			const t2TargetURLsArray: string[] = [...t2SubBlock1URLs, ...t2SubBlock2URLs, ...t2SubBlock3URLs];
			*/
			
			let blockStruct = {
				blockType: blockType,
				digitalWatchURLsArray: digitalWatchURLsArray,
				analogueWatchURLsArray: analogueWatchURLsArray,
				t2DisplayPotentialArray: t2DisplayPotentialArray,
				t2DisplayGapOptions: t2DisplayGapOptions,
				t2TargetURLsArray: t2TargetURLsArray,
				trialArrayURLs: [],
				t2PosGap: -1,
				t2Displayed: false,
				isDigital: false,
				isAnalogue: false,
			} as BlockStruct
			
			machine.transition(State.Block, blockStruct);
		}, // end onEnter State.BlockInitialiser
		// onExit: () => {}
	}) // end addState State.BlockInitialiser
	
	SM.addState(State.Block, {
		// this state determines whether or not to go to the next block, do another trial, or finish
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			if (blockStruct.digitalWatchURLsArray.length === 0 && blockStruct.analogueWatchURLsArray.length === 0 && blockStruct.t2DisplayGapOptions.length === 0 && blockStruct.t2TargetURLsArray.length === 0) {
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
				machine.transition(State.PreTrial, blockStruct)
				
			}
		}, // end onEnter State.Block
		// onExit: () => {}
	}) // end addState State.Block
	
	SM.addState(State.PreTrial, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			// initialise distractor array
			var trialArrayURLs: string[] = [];
			
			// choose T1 URL
			// const t1ImageURL: string = utils.takeRand(blockStruct.t1TargetURLsArray);
			var t1ImageURL: string = '';
			const watchTypeDeterministicNumber: number = utils.takeRand(watchDisplayTypes);
			var watchType: number = watchTypeDeterministicNumber % 2;
			// blockStruct.watchType = watchType;
			if (watchType == 0) {
				blockStruct.isDigital = true;
				blockStruct.isAnalogue = false;
				t1ImageURL = utils.takeRand(blockStruct.digitalWatchURLsArray);
			} else { // i.e., watchType == 1
				blockStruct.isAnalogue = true;
				blockStruct.isDigital = false;
				t1ImageURL = utils.takeRand(blockStruct.analogueWatchURLsArray);
			}
			console.log("T1 image has been chosen: " + t1ImageURL);
			console.log("T1 image possibilities left are" + blockStruct.digitalWatchURLsArray + " or " + blockStruct.analogueWatchURLsArray);
			
			// choose whether or not T2 is displayed
			const t2DeterministicNumber: number = utils.takeRand(blockStruct.t2DisplayPotentialArray)
			if (t2DeterministicNumber % 2 == 0) {
				// do not display T2
				console.log("T2 image is not being displayed");
				blockStruct.t2Displayed = false;
				// construct random distractor array
				trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 1);
				const randomInsertIndex: number = utils.randInt(0, nInImageSequence - 1);
				// insert T1 into trial array
				utils.insert(trialArrayURLs, randomInsertIndex, t1ImageURL);
			} else {
				// display T2; more complex choices to make (what T2 is)
				blockStruct.t2Displayed = true;
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
				
				// cannot divide 100 by 3 evenly, so the one of the t2PosGaps will have to have 34 in them.
				if (t2ImageTypeNumber == 100) {
					t2PosGap = utils.randVal([1, 3, 7]);
				}
				else {
					if (t2ImageTypeNumberModulo == 0) {
						t2PosGap = 1;
					} else if (t2ImageTypeNumberModulo == 1) {
						t2PosGap = 3;
					} else { // t2ImageTypeNumberModulo == 2
						t2PosGap = 7;
					}
				}
				console.log('So image gap is' + t2PosGap);
				blockStruct.t2PosGap = t2PosGap;
				
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
			// gorilla.populateAndLoad($('#gorilla'), 'trial', {
			// 	thistrial: '', // hbs file expects some input but we don't have the exact image yet
			// }, () => {
			// machine.transition(State.FixationCross, blockStruct);
			machine.transition(State.Trial, blockStruct);
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
		}, // end onEnter State.PreTrial
		// onExit: () => {
		// 	machine.transition(State.Block, blockStruct);
		// } // end onExit State.PreTrial
	}) // end addState State.PreTrial
	
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
					machine.transition(State.Trial, blockStruct);
					$(this).dequeue();
				});
			// machine.transition(State.Trial, blockStruct);
		// }) // end populateAndLoad
		} // end onEnter
	}) // end addState State.FixationCross
	
	SM.addState(State.Trial, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			console.log("We are in the sub-trial state, and we are now going to display the trial array: " + blockStruct.trialArrayURLs)
			
			// if (blockStruct.trialArrayURLs.length === 0) {
			// 	// then we need to initialise another trial!
			// 	machine.transition(State.Response, blockStruct);
			// } else {
				// then we need to start, or are still, looping through the trial array
				
				// choose the first, or next, image from the trial array
				// const thistrial: string = utils.takeFirst(blockStruct.trialArrayURLs);
				
				function showTrial(i: number) {
					$('#gorilla')
					.queue(function (next) {
						$('#trial-image-' + i).css('visibility','visible');
						next();
					}) // end queue for '#gorilla'
					.delay(imageDisplayLength)
					.queue(function (next) {
						// this queue isn't strictly necessary, as we loop through the trial state, replacing the trial image
						$('#trial-image-' + i).css('visibility','hidden');
						if ((i + 1) == 20) {
							machine.transition(State.WatchTypeResponse, blockStruct);
						} else {
							showTrial(i + 1);
						}
						next();
					}) // end queue for '#gorilla'
				}
				
				
				// gorilla.populate('#gorilla', 'fixation', {});
				// // $('.fixation-cross').hide();
				// // gorilla.refreshLayout();
				// console.log("Showing fixation cross for " + fixationLength / 1000 + " seconds");
				// $('#gorilla')
				// 	.delay(beforeFixationDelay)
				// 	.queue(function (next) {
				// 		$('.fixation-cross').show();
				// 		gorilla.refreshLayout();
				// 		// $(this).dequeue();
				// 		next();
				// 	})// end queue for '#gorilla'
				// 	.delay(fixationLength)
				// 	.queue(function (next) {
				// 		$('.fixation-cross').hide();
				// 		gorilla.refreshLayout();
				// 		// $(this).dequeue();
				// 		next();
				// 	}) // end queue for '#gorilla'
				// 	.delay(afterFixationDelay)
				// 	.queue(function (next) {
				// 		// machine.transition(State.Trial, blockStruct);
				// 		// $(this).dequeue();
				// 		next();
				// 	});
				gorilla.populateAndLoad('#gorilla', 'trial', {trialarray: blockStruct.trialArrayURLs},() => {
					$('#gorilla')
						.delay(beforeFixationDelay)
						.queue(function (next) {
							$('.fixation-cross').show();
							gorilla.refreshLayout();
							// $(this).dequeue();
							next();
						})// end queue for '#gorilla'
						.delay(fixationLength)
						.queue(function (next) {
							$('.fixation-cross').hide();
							gorilla.refreshLayout();
							// $(this).dequeue();
							next();
						}) // end queue for '#gorilla'
						.delay(afterFixationDelay)
						.queue(function (next) {
							// machine.transition(State.Trial, blockStruct);
							// $(this).dequeue();
							showTrial(0);
							next();
						});
					// showTrial(0);
					// var i: number = 0;
					// while (true) {
					// 	$('#gorilla')
					// 	.queue(function (next) {
					// 		$('#trial-image-' + i).css('visibility','visible');
					// 		next();
					// 	}) // end queue for '#gorilla'
					// 	.delay(imageDisplayLength)
					// 	.queue(function (next) {
					// 		// this queue isn't strictly necessary, as we loop through the trial state, replacing the trial image
					// 		$('#trial-image-' + i).css('visibility','hidden');
					// 		if ((i + 1) == 20) {
					// 			machine.transition(State.Response, blockStruct);
					// 		} else {
					// 			i++;
					// 		}
					// 		next();
					// 	}) // end queue for '#gorilla'
					// }
					
					/*
					for (var i: number = 0; i < 20; i++) {
					
					
					// var i: number = 0;
					// while (true) {
						// if (blockStruct.trialArrayURLs.length === 0) {
						// if (i == 20) {
						// 	// then we need to initialise another trial!
						// 	machine.transition(State.Response, blockStruct);
						// } else {
							// const thistrial: string = utils.takeFirst(blockStruct.trialArrayURLs);
							// const thisid: string =
							$('#gorilla')
							.queue(function (next) {
								// $('.trial-image').$('#' + i).css('visibility','visible');
								$('#trial-image-' + i).css('visibility','visible');
								// $('#trial-image-' + i).show();
								next();
							}) // end queue for '#gorilla'
							.delay(imageDisplayLength)
							.queue(function (next) {
								// this queue isn't strictly necessary, as we loop through the trial state, replacing the trial image
								// $('.trial-image').css('visibility','hidden');
								$('#trial-image-' + i).css('visibility','hidden');
								// $('#trial-image-' + i).hide();
								// i++;
								if (i == (20 - 1)) {
									// then we need to initialise another trial!
									machine.transition(State.Response, blockStruct);
								}
								next();
							}) // end queue for '#gorilla'
						// }
						// if (i == 20 - 1) {
						// 	// then we need to initialise another trial!
							// machine.transition(State.Response, blockStruct);
						// }
					}*/
					
					// showTrial(blockStruct.trialArrayURLs);
					
                    // $('#gorilla')
					// .queue(function (next) {
					// 	$('.trial-image').css('visibility','visible');
					// 	next();
					// }) // end queue for '#gorilla'
					// .delay(imageDisplayLength)
					// .queue(function (next) {
					// 	// this queue isn't strictly necessary, as we loop through the trial state, replacing the trial image
					// 	$('.trial-image').css('visibility','hidden');
					// 	next();
					// }) // end queue for '#gorilla'
					// .queue(function (next) {
					// 	// once again, must be inside the queue or it will not display
					// 	machine.transition(State.Trial, blockStruct);
					// 	next();
					// }) // end queue for '#gorilla'
                });
            // } // end if
			
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
				
				// gorilla.populateAndLoad($('#gorilla'), 'trial', {
					// thistrial: thistrial,
				// }, () => {
				// gorilla.populateAndLoad('#gorilla', 'trial', {
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
				// 			gorilla.populate('#gorilla', 'trial', {thistrial: thistrial});
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
				// 				// 		machine.transition(State.Trial, blockStruct);
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
				// 		machine.transition(State.Trial, blockStruct);
				// 		$(this).dequeue();
				// 	})
				// // machine.transition(State.Trial, blockStruct);
				
						
				// }) // end populateAndLoad
			// } // end if
		} // end onEnter
	}) // end addState State.Trial
	
	SM.addState(State.WatchTypeResponse, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			// var imageType: string = '';
			// if (blockStruct.blockType == 'F') {
			// 	imageType = 'an image of a face';
			// } else if (blockStruct.blockType == 'P') {
			// 	imageType = 'a pareidolia image';
			// } else {// blockStruct.blockType == 'O'
			// 	imageType = 'an image of a flower';
			// }
			gorilla.populateAndLoad($('#gorilla'), 'watch-type-response', {
					digitalPresent: digitalResponseKey.toUpperCase(),
					analoguePresent: analogueResponseKey.toUpperCase(),
					// imageType: imageType,
				    // blockCounter: blockCounter,
				    // nBlocks: nBlocks,
					// trialType: utils.encodeTargetTypeHR(targetType),
					// e1: gorilla.stimuliURL(examples[0]),
					// e2: gorilla.stimuliURL(examples[1]),
					// e3: gorilla.stimuliURL(examples[2]),
					// imSize: exampleImSize
				}, (err) => {
					// $('#gorilla').show();
					// $('#start-button').one('click', (event: JQueryEventObject) => {
					// 	machine.transition(State.Block, blockStruct);
					// }) // end on click
					
					$('#gorilla')
		            .queue(function (next) {
		                $('.watch-type-reponse').show();
						// $('#digitalOrAnalogue').show();
		                gorilla.refreshLayout();
		                gorilla.startStopwatch();
		                keypressAllowed = true;
		                // $(this).dequeue();
						next();
		            }) // end queue for '#gorilla'
		        
			        $(document).off('keypress').on('keypress', (event: JQueryEventObject) => {
			            // exit the keypress event if we are not allowed to!
			            if (!keypressAllowed) return;
			            
			            // get the key that was pressed
			            const e = event.which;
			            
			            // enter state where it can't enter any more keys
			            if (e === digitalResponseKeyCode || e === analogueResponseKeyCode) {
			                // stop timout timer!
			                // stateTimer.cancel();
			                
			                // update keypress as we have just pressed the key!
			                keypressAllowed = false;
							var watchTypeIsCorrect: boolean = false;
			                
			                // check if key press was correct
			                if ((blockStruct.isDigital && !blockStruct.isAnalogue && e === digitalResponseKeyCode) || (blockStruct.isAnalogue && !blockStruct.isDigital && e === analogueResponseKeyCode)) {
			                	// correct!
			                	watchTypeIsCorrect = true;
			                } else {
			                	// incorrect response
			                }
							
							
			                
			                // move on transition
			                $('#gorilla')
			                    .queue(function () {
			                        machine.transition(State.T2SeenResponse, blockStruct);
			                        $(this).dequeue();
			                    }); // end queue for '#gorilla'
			            } // end checking if key pressed is K or L
			        }) // end response keypress
					
				}); // end populate and load
		} // end onEnter
	}) // end addState State.WatchTypeResponse
	
	SM.addState(State.T2SeenResponse, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			var imageType: string = '';
			if (blockStruct.blockType == 'F') {
				imageType = 'a face';
			} else if (blockStruct.blockType == 'P') {
				imageType = 'an object that looks like a face';
			// } else {// blockStruct.blockType == 'O'
		} else if (blockStruct.blockType == 'O') {
				imageType = 'a flower';
			}
			gorilla.populateAndLoad($('#gorilla'), 't2-seen-response', {
					imageType: imageType,
					targetPresent: presentResponseKey.toUpperCase(),
					targetAbsent: absentResponseKey.toUpperCase(),
				    // blockCounter: blockCounter,
				    // nBlocks: nBlocks,
					// trialType: utils.encodeTargetTypeHR(targetType),
					// e1: gorilla.stimuliURL(examples[0]),
					// e2: gorilla.stimuliURL(examples[1]),
					// e3: gorilla.stimuliURL(examples[2]),
					// imSize: exampleImSize
				}, (err) => {
					// $('#gorilla').show();
					// $('#start-button').one('click', (event: JQueryEventObject) => {
					// 	machine.transition(State.Block, blockStruct);
					// }) // end on click
					
					$('#gorilla')
		            .queue(function (next) {
		                $('.t2-seen-reponse').show();
						// $('#digitalOrAnalogue').show();
		                gorilla.refreshLayout();
		                gorilla.startStopwatch();
		                keypressAllowed = true;
		                // $(this).dequeue();
						next();
		            }) // end queue for '#gorilla'
		        
			        $(document).off('keypress').on('keypress', (event: JQueryEventObject) => {
			            // exit the keypress event if we are not allowed to!
			            if (!keypressAllowed) return;
			            
			            // get the key that was pressed
			            const e = event.which;
			            
			            // enter state where it can't enter any more keys
			            if (e === presentResponseKeyCode || e === absentResponseKeyCode) {
			                // stop timout timer!
			                // stateTimer.cancel();
			                
			                // update keypress as we have just pressed the key!
			                keypressAllowed = false;
							var correctResponse: boolean = false;
			                
			                // check if key press was correct
			                if ((blockStruct.t2Displayed && e === presentResponseKeyCode) || (!blockStruct.t2Displayed && e === absentResponseKeyCode)) {
			                	// correct!
			                	correctResponse = true;
			                } else {
			                	// incorrect response
			                }
							
							
			                
			                // move on transition
			                $('#gorilla')
			                    .queue(function () {
			                        machine.transition(State.Block, blockStruct);
			                        $(this).dequeue();
			                    }); // end queue for '#gorilla'
			            } // end checking if key pressed is K or L
			        }) // end response keypress
					
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
