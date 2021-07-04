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
const nDistractors: number = 500;
const beforeFixationDelay: number = 500;
const fixationLength: number = 500;
const afterFixationDelay: number = 0;
const imageDisplayLength: number = 70; // 70
const presentResponseKey: string = 'k';
const absentResponseKey: string = 'l';
const digitalResponseKey: string = 'k';
const analogueResponseKey: string = 'l';
const nBlocks: number = 3;
const loadingMessage: string = 'Please wait while the experiment is loading.  This may take some time.';
const consentFilename: string = 'PareidoliaVisualSearch_InfoSheet.pdf';
const debriefFilename: string = 'PareidoliaVisualSearch_Debriefing.pdf';

// 3 blocks, with constant T2 type

/* ------------------------------------- */
// There is not much that you should need
// to change below this line!
/*--------------------------------------*/

const nTrials: number = nT2ImagesPerBlock * 3 * 2; // 100 T2 images per block * 3 blocks * 2 trial types = 600
const nT2Displayed: number = Math.floor(nT2ImagesPerBlock / blockTypes.length);
const nT1ImagesPerBlock: number = nT2ImagesPerBlock * 2; // 100 T2 images per block * 2 trial types = 200
const constBlockTypes: string[] = [...blockTypes];
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
  	PreloadArrays,
	PreloadStimuli,
	Consent,
	RequestFullscreen,
	Demographics,
	Instructions,
	BlockInitialiser,
	Block,
  	InterBlockBreak,
	PreTrial,
	FixationCross,
	Trial,
	WatchTypeResponse,
	T2SeenResponse,
	Finish,
}

interface TrialStruct {
	t1ResponseKey: String,
	t2ResponseKey: String,
	t1ResponseTime: number,
	t2ResponseTime: number,
	t1ConditionType: string,
	t2Present: boolean,
	t1ResponseCorrect: boolean,
	t2ResponseCorrect: boolean,
}

interface T1Struct {
	t1ResponseKey: String,
	t1ResponseTime: number,
	t1ConditionType: string,
	t1ResponseCorrect: boolean,
}

interface BlockStruct {
  	trialCounter: number,
	blockType: string,
  	blockTypeHR: string,
	digitalWatchURLsArray: string[],
	analogueWatchURLsArray: string[],
	t2DisplayPotentialArray: number[],
	t2DisplayGapOptions: number[],
	t2TargetURLsArray: string[],
	trialArrayURLs: string[],
	t2PosGap: number,
	t2Condition: string,
	isDigital: boolean,
	isAnalogue: boolean,
	thisTrialStruct: T1Struct,
}

// need demographics to be global
var participantID: string;
var participantGender: string;
var participantAge: number;


//// INITIALISE URL LISTS BEFORE TASK BEGINS
// set number array for main target variables
var allFacesAsNumbers: number[];
var allObjectsAsNumbers: number[];
var allPareidoliaAsNumbers: number[];
var allDigitalWatchesAsNumbers: number[];
var allAnalogueWatchesAsNumbers: number[];
// construct array of T2 images
var allFaceNames: string[];
var allObjectNames: string[];
var allPareidoliaNames: string[];
var allDigitalWatchNames: string[];
var allAnalogueWatchNames: string[];

// set URL array of all distractors
var allDistractorNumbers: number[];
var allDistractorNames: string[];

// construct a number array to help determine which type of watch to display
var watchDisplayTypes: number[];

// need demographics to be global
var participantID: string;
var participantGender: string;
var participantAge: number;

// this is the main gorilla function call!
gorilla.ready(function(){
	// initialise stopwatch
  gorilla.initialiseTimer();

	// initialise state machine
	var SM = new stateMachine.StateMachine();

  // initialise a block counter
  var blockCounter: number = 0;

  SM.addState(State.PreloadArrays, {
    onEnter: (machine: stateMachine.Machine) => {
      gorilla.populateAndLoad('#gorilla', 'loading', {
		  	loadingMessage: loadingMessage,
	  }, () => {
        	//// INITIALISE URL LISTS BEFORE TASK BEGINS
        	// set number array for main target variables
        	allFacesAsNumbers = utils.constructNumberArray(1, nT2ImagesPerBlock);
        	allObjectsAsNumbers = utils.constructNumberArray(1, nT2ImagesPerBlock);
        	allPareidoliaAsNumbers = utils.constructNumberArray(1, nT2ImagesPerBlock);
        	allDigitalWatchesAsNumbers = utils.constructNumberArray(1, nSpecificWatches);
        	allAnalogueWatchesAsNumbers = utils.constructNumberArray(1, nSpecificWatches);
        	// construct array of T2 images
        	allFaceNames = utils.constructNameArray(allFacesAsNumbers, 'Face', '.' + stimExt);
        	allObjectNames = utils.constructNameArray(allObjectsAsNumbers, 'Flower', '.' + stimExt);
        	allPareidoliaNames = utils.constructNameArray(allPareidoliaAsNumbers, 'Pareidolia', '.' + stimExt);
        	allDigitalWatchNames = utils.constructNameArray(allDigitalWatchesAsNumbers, 'Digital', '.' + stimExt);
        	allAnalogueWatchNames = utils.constructNameArray(allAnalogueWatchesAsNumbers, 'Analogue', '.' + stimExt);
        	// convert to URLs
        	allFaceURLs = constructURLArray(allFaceNames);
        	allObjectURLs = constructURLArray(allObjectNames);
        	allPareidoliaURLs = constructURLArray(allPareidoliaNames);
        	allDigitalWatchURLs = constructURLArray(allDigitalWatchNames);
        	allAnalogueWatchURLs = constructURLArray(allAnalogueWatchNames);

        	// set URL array of all distractors
        	allDistractorNumbers = utils.constructNumberArray(1, nDistractors);
        	allDistractorNames = utils.constructNameArray(allDistractorNumbers, 'D', '.' + stimExt)
        	allDistractorURLs = constructURLArray(allDistractorNames);

        	// construct a number array to help determine which type of watch to display
        	watchDisplayTypes = utils.constructNumberArray(1, nT1ImagesPerBlock);

          // put all image URLs into a single vector for preloading
          const allImageURLs: string[] = [
              ...allDistractorURLs,
              ...allDigitalWatchURLs,
              ...allAnalogueWatchURLs,
              ...allFaceURLs,
              ...allPareidoliaURLs,
              ...allObjectURLs
          ];

          console.log("There are " + (allImageURLs.length + 1) + " images preloaded")

          machine.transition(State.PreloadStimuli, allImageURLs);
      });
    } // end onEnter
  }) // end addState PreloadStimuli

	SM.addState(State.PreloadStimuli, {
		onEnter: (machine: stateMachine.Machine, allImageURLs: string[]) => {
			gorilla.populateAndLoad('#gorilla', 'allstim', {
				loadingMessage: loadingMessage,
				stimulusarray: allImageURLs,
			},() => {
				// document.addEventListener("DOMContentLoaded", () => {
				// $(window).load(function() {
				// window.addEventListener('load', (event) => {
					machine.transition(State.Consent);
				// });
			})
		}, // on onEnter
	}) // end addState PreloadStimuli
	
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
	}) // end addState State.Consent

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
		    // increment block counter
		    blockCounter++;
			// get variables based on block type (e.g., object, face, pareidolia)
			const blockType: string = utils.takeRand(blockTypes); // remove a random element from the blockTypes array
			console.log("We have chosen block type " + blockType);

			// construct (potentially repeating; i.e., not unique) array of suffled digital/analogue watches
			const digitalWatchURLsArray: string[] = utils.chooseNRand(allDigitalWatchURLs, nSpecificWatchesPerBlock);
			const analogueWatchURLsArray: string[] = utils.chooseNRand(allAnalogueWatchURLs, nSpecificWatchesPerBlock);

			// construct tT array
			var t2TargetURLsArray: string[] = [];
      		var imageTypeHR: string;
			if (blockType == 'F') {
				t2TargetURLsArray = utils.takeNRand(allFaceURLs, nT2ImagesPerBlock);
        		imageTypeHR = 'a face';
			} else if (blockType == 'P') {
				t2TargetURLsArray = utils.takeNRand(allPareidoliaURLs, nT2ImagesPerBlock);
        		imageTypeHR = 'an object that looks like a face';
			} else { // blockType == 'O'
				t2TargetURLsArray = utils.takeNRand(allObjectURLs, nT2ImagesPerBlock);
        		imageTypeHR = 'a flower';
			};
			console.log("The random second target images we have in this block is: " + t2TargetURLsArray);

			var t2DisplayPotentialArray: number[] = utils.constructNumberArray(1, nT1ImagesPerBlock); // whether or not T2 is displayed
			var t2DisplayGapOptions: number[] = utils.constructNumberArray(1, nT2ImagesPerBlock);

			let blockStruct = {
        		trialCounter: 0,
				blockType: blockType,
        		blockTypeHR: imageTypeHR,
				digitalWatchURLsArray: digitalWatchURLsArray,
				analogueWatchURLsArray: analogueWatchURLsArray,
				t2DisplayPotentialArray: t2DisplayPotentialArray,
				t2DisplayGapOptions: t2DisplayGapOptions,
				t2TargetURLsArray: t2TargetURLsArray,
				trialArrayURLs: [],
				t2PosGap: 0,
				t2Condition: "",
				isDigital: false,
				isAnalogue: false,
			} as BlockStruct

      // display block instructions
      gorilla.populateAndLoad($('#gorilla'), 'block-instructions', {
				  blockCounter: blockCounter,
				  nBlocks: nBlocks,
					trialType: imageTypeHR,
				}, (err) => {
					$('#gorilla').show();
					$('#start-button').one('click', (event: JQueryEventObject) => {
						machine.transition(State.Block, blockStruct);
					}) // end on keypress
				}); // end populate and load
		}, // end onEnter State.BlockInitialiser
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
				// if our trial is not over yet
        if (blockStruct.trialCounter == nT2ImagesPerBlock) { // either go to a break screen
				    machine.transition(State.InterBlockBreak, blockStruct)
        } else { // or continue
            machine.transition(State.PreTrial, blockStruct)
        }
			}
		}, // end onEnter State.Block
	}) // end addState State.Block

  SM.addState(State.InterBlockBreak, {
    // this state determines whether or not to go to the next block, do another trial, or finish
    onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
      gorilla.populateAndLoad('#gorilla', 'inter-block-break', {}, () => {
        $('#next-button').one('click', (event: JQueryEventObject) => {
					// transition to the rest of block
					machine.transition(State.PreTrial, blockStruct)
				}) // end on click start button
      })
    }, // end onEnter State.Block
  }) // end addState State.Block

	SM.addState(State.PreTrial, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
	      	// increment trail counter (needed for breaks)
	      	blockStruct.trialCounter++;

			// initialise distractor array
			var trialArrayURLs: string[] = [];

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
			console.log("T1 image possibilities left are " + blockStruct.digitalWatchURLsArray + " or " + blockStruct.analogueWatchURLsArray);

			// choose whether or not T2 is displayed
			const t2DeterministicNumber: number = utils.takeRand(blockStruct.t2DisplayPotentialArray)
			if (t2DeterministicNumber % 2 == 0) {
				// do not display T2
				console.log("T2 image is not being displayed");
				blockStruct.t2Condition = "Absent";
				// construct random distractor array
				trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 1);
				const randomInsertIndex: number = utils.randInt(0, nInImageSequence - 1);
				// insert T1 into trial array
				utils.insert(trialArrayURLs, randomInsertIndex, t1ImageURL);
		        // be sure to redefine the position gap for metric recording
		        blockStruct.t2PosGap = 0;
			} else {
				// display T2; more complex choices to make (what T2 is)
				blockStruct.t2Condition = "Present";
				const t2ImageURL: string = utils.takeRand(blockStruct.t2TargetURLsArray);
				console.log("We are going to display T2");
				console.log("T2 image has been chosen: " + t2ImageURL);
				console.log("T2 image possibilities left are " + blockStruct.t2TargetURLsArray);
				// construct random distractor array
				trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 2);

				// choose T2 image gap
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
			
			console.log("THE TRIAL COUNTER IS " + blockStruct.trialCounter);
			machine.transition(State.Trial, blockStruct);
		}, // end onEnter State.PreTrial
	}) // end addState State.PreTrial

	// SM.addState(State.FixationCross, {
	// 	onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
	// 		gorilla.populate('#gorilla', 'fixation', {});
	// 		console.log("Showing fixation cross for " + fixationLength / 1000 + " seconds");
	// 		$('#gorilla')
	// 			.delay(beforeFixationDelay)
	// 			.queue(function () {
	// 				$('.fixation-cross').show();
	// 				gorilla.refreshLayout();
	// 				$(this).dequeue();
	// 			})// end queue for '#gorilla'
	// 			.delay(fixationLength)
	// 			.queue(function () {
	// 				$('.fixation-cross').hide();
	// 				gorilla.refreshLayout();
	// 				$(this).dequeue();
	// 			}) // end queue for '#gorilla'
	// 			.delay(afterFixationDelay)
	// 			.queue(function () {
	// 				machine.transition(State.Trial, blockStruct);
	// 				$(this).dequeue();
	// 			});
	// 	} // end onEnter
	// }) // end addState State.FixationCross

	SM.addState(State.Trial, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			console.log("We are in the sub-trial state, and we are now going to display the trial array: " + blockStruct.trialArrayURLs)

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
        });
		} // end onEnter
	}) // end addState State.Trial

	SM.addState(State.WatchTypeResponse, {
		onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
			gorilla.populateAndLoad($('#gorilla'), 'watch-type-response', {
					digitalPresent: digitalResponseKey.toUpperCase(),
					analoguePresent: analogueResponseKey.toUpperCase(),
				}, (err) => {

					$('#gorilla')
		            .queue(function (next) {
		                $('.watch-type-reponse').show();
		                gorilla.refreshLayout();
		                gorilla.startStopwatch();
		                keypressAllowed = true;
						        next();
		            }) // end queue for '#gorilla'

			        $(document).off('keypress').on('keypress', (event: JQueryEventObject) => {
			            // exit the keypress event if we are not allowed to!
			            if (!keypressAllowed) return;

			            // get the key that was pressed
			            const e = event.which;

			            // enter state where it can't enter any more keys
			            if (e === digitalResponseKeyCode || e === analogueResponseKeyCode) {
        							gorilla.stopStopwatch();

        							// IMPORTANT: get response time!
        							// This is the main metric!
        							const responseTime: number = gorilla.getStopwatch();

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

        							var t1Condition: string = ""
        							if (blockStruct.isDigital) {
        								t1Condition = "Digital"
        							} else if (blockStruct.isAnalogue) {
        								t1Condition = "Analogue"
        							}

        							const t1ResponseAsString: string = String.fromCharCode(e)

        							// construct a trial struct to put into the BlockStruct for metrics
        							let thisT1Struct = {
        								t1ConditionType: t1Condition,
        								t1ResponseCorrect: watchTypeIsCorrect,
        								t1ResponseKey: t1ResponseAsString,
        								t1ResponseTime:  responseTime,
        							} as T1Struct

        							// Add the trial struct to the block struct so that we can add metrics in one function call
        							blockStruct.thisTrialStruct = thisT1Struct;

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
			gorilla.populateAndLoad($('#gorilla'), 't2-seen-response', {
					imageType: blockStruct.blockTypeHR,
					targetPresent: presentResponseKey.toUpperCase(),
					targetAbsent: absentResponseKey.toUpperCase(),
				}, (err) => {
					$('#gorilla')
		            .queue(function (next) {
		                $('.t2-seen-reponse').show();
		                gorilla.refreshLayout();
		                gorilla.startStopwatch();
		                keypressAllowed = true;
						        next();
		            }) // end queue for '#gorilla'

			        $(document).off('keypress').on('keypress', (event: JQueryEventObject) => {
			            // exit the keypress event if we are not allowed to!
			            if (!keypressAllowed) return;

			            // get the key that was pressed
			            const e = event.which;

			            // enter state where it can't enter any more keys
			            if (e === presentResponseKeyCode || e === absentResponseKeyCode) {
        							gorilla.stopStopwatch();

        							// IMPORTANT: get response time!
        							// This is the main metric!
        							const responseTime: number = gorilla.getStopwatch();

        			                // update keypress as we have just pressed the key!
        			                keypressAllowed = false;
        							        var correctResponse: boolean = false;

        			                // check if key press was correct
        			                if ((blockStruct.t2Condition == "Present" && e === presentResponseKeyCode) || (blockStruct.t2Condition == "Absent" && e === absentResponseKeyCode)) {
        			                	// correct!
        			                	correctResponse = true;
        			                } else {
        			                	// incorrect response
        			                }

        							const t2ResponseAsString: string = String.fromCharCode(e)

        							// Actually *store* the data!
        							// IMPORTANT: these keys had to be imported into the `Metircs` tab!
        							gorilla.metric({
        								t1_response_key: blockStruct.thisTrialStruct.t1ResponseKey,
        								t1_condition: blockStruct.thisTrialStruct.t1ConditionType,
        								t1_response_correct: blockStruct.thisTrialStruct.t1ResponseCorrect,
        								t1_response_time: blockStruct.thisTrialStruct.t1ResponseTime,
                        				t2_category: blockStruct.blockType,
        								t2_condition: blockStruct.t2Condition,
                        				t2_position_gap: blockStruct.t2PosGap,
        								t2_response_correct: correctResponse,
        								t2_response_key: t2ResponseAsString,
        								t2_response_time:  responseTime,
        								age: participantAge,
        								id: participantID,
        								gender: participantGender,
        							}); // end metric

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
        SM.start(State.PreloadArrays);
	}) // end gorilla run
}) // end gorilla ready
