/*--------------------------------------*/
// This is the main programme file that
// runs when the programme is started.
/*--------------------------------------*/

// API imports
import gorilla = require('gorilla/gorilla');
import stateMachine = require("gorilla/state_machine");
// our imports
import utils = require('utils');
import trial = require('trial');
import config = require('config');
import {
	GlobalExperimentState, ExperimentConfigs, ResponseKeyCode, 
	ImageType, ImageStruct, State, TrialStruct, TargetCondition, 
	PracticeTrialStruct, BlockStruct,
} from 'types';

/*--------------------------------------*/
// Define a global experiment struct that will
// help us to keep track of important experiment
// information throught all blocks/trials
/*--------------------------------------*/

var exprState = new GlobalExperimentState(config.exprConfigs);

if ((exprState.nT2ImagesPerBlock % exprState.lagPositions.length) !== 0) {
	console.warn('The number of T2 images does not divide equally into the number of lag positions you have specified.')
}

/*--------------------------------------*/
// There is not much that you should need
// to change below this line!
/*--------------------------------------*/

// global boolean variable which we update in order to check
// if we are allowed to press the response key or not
var keypressAllowed: boolean = false;

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

// Given an image name and type, construct its ImageStruct representation
function getImageStruct(name: string, type: ImageType) {
	return {
		url: gorilla.stimuliURL(name),
		name: name,
		type: type,
	} as ImageStruct
}

// Given an array of stimuli names and their type, constructs an array
// of stimuli images of type ImageStruct
function constructImageArray(stimArr: string[], imgType: ImageType) {
    var imageInfoArr: ImageStruct[] = [];
	for (var i: number = 0; i < stimArr.length; i++) {
		const imageInfo: ImageStruct = getImageStruct(stimArr[i], imgType);
		imageInfoArr.push(imageInfo);
	}

	return imageInfoArr;
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
var allWatchesAsNumbers: number[];

// construct array of T2 images
var allFaceNames: string[];
var allObjectNames: string[];
var allPareidoliaNames: string[];
var allWatchNames: string[];

// initialise number array for main target variables as global
var allFaceURLs: string[];
var allObjectURLs: string[];
var allPareidoliaURLs: string[];
var allWatchURLs: string[];
var allPracticeTargetImages: ImageStruct[];  // TODO: this might need to be turned back to URLs in the interest of preloading
var allExampleTargets: Object = {};

// initialise URL array of all distractors as global
var allDistractorURLs: string[];

// set URL array of all distractors
var allDistractorNumbers: number[];
var allDistractorNames: string[];

// all practice images
var practiceImageNumbersPerT1Type: number[];
var practiceFaceNames: string[];
var practiceWatchNames: string[];
var practicePareidoliaNames: string[];
var practiceFaceImages: ImageStruct[];
var practiceWatchImages: ImageStruct[];
var practicePareidoliaImages: ImageStruct[];
var practiceT1Images: ImageStruct[];
var practiceT2Images: ImageStruct[];

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
		  	loadingMessage: exprState.imageLoadingMessage,
	  }, () => {
        	//// INITIALISE URL LISTS BEFORE TASK BEGINS
        	// set number array for main target variables
			// TODO: make these numbers dynamic/come from a dictionary of (ImageType => nImages)
        	allFacesAsNumbers = utils.constructNumberArray(1, exprState.nT2ImagesPerBlock);
        	allObjectsAsNumbers = utils.constructNumberArray(1, exprState.nT2ImagesPerBlock);
        	allPareidoliaAsNumbers = utils.constructNumberArray(1, exprState.nT2ImagesPerBlock);
        	allWatchesAsNumbers = utils.constructNumberArray(1, exprState.nWatchImages); // TODO: nWatchImages doesn't exist
        	// construct array of T2 images
        	allFaceNames = utils.constructNameArray(allFacesAsNumbers, 'Face', '.' + exprState.imageUtilsConfigs.imgExt);
        	allObjectNames = utils.constructNameArray(allObjectsAsNumbers, 'Flower', '.' + exprState.imageUtilsConfigs.imgExt);
        	allPareidoliaNames = utils.constructNameArray(allPareidoliaAsNumbers, 'Pareidolia', '.' + exprState.imageUtilsConfigs.imgExt);
        	allWatchNames = utils.constructNameArray(allWatchesAsNumbers, 'Analogue', '.' + exprState.imageUtilsConfigs.imgExt);
        	// convert to URLs
        	exprState.allFaceURLs = constructURLArray(allFaceNames);
        	exprState.allObjectURLs = constructURLArray(allObjectNames);
        	exprState.allPareidoliaURLs = constructURLArray(allPareidoliaNames);
        	exprState.allWatchURLs = constructURLArray(allWatchNames);

        	// set URL array of all distractors
        	allDistractorNumbers = utils.constructNumberArray(1, exprState.nDistractors);
        	allDistractorNames = utils.constructNameArray(allDistractorNumbers, 'D', '.' + exprState.imageUtilsConfigs.imgExt)
        	allDistractorURLs = constructURLArray(allDistractorNames);

			// get practice targets
			practiceImageNumbersPerT1Type = utils.constructNumberArray(1, exprState.nPracticeT1ImagesPerT1Type);
			practiceFaceNames = utils.constructNameArray(practiceImageNumbersPerT1Type, 'Pface', '.' + exprState.imageUtilsConfigs.imgExt);
			practiceWatchNames = utils.constructNameArray(practiceImageNumbersPerT1Type, 'Pwatch', '.' + exprState.imageUtilsConfigs.imgExt);;
			practicePareidoliaNames = utils.constructNameArray(practiceImageNumbersPerT1Type, 'Ppareidolia', '.' + exprState.imageUtilsConfigs.imgExt);;
			practiceFaceImages = constructImageArray(practiceFaceNames, ImageType.Face);
			practiceWatchImages = constructImageArray(practiceWatchNames, ImageType.Watch);
			practicePareidoliaImages = constructImageArray(practicePareidoliaNames, ImageType.Pareidolia);
			practiceT1Images = [
				...practiceFaceImages,
				...practiceWatchImages,
				...practicePareidoliaImages
			];
			practiceT2Images = constructImageArray(utils.generatePracticeArray('Bird'), ImageType.Bird);
			allPracticeTargetImages = [
				...practiceT1Images,
				...practiceT2Images
			];

			// add example target arrays as URLs to object
			allExampleTargets['watch'] = gorilla.stimuliURL('watchExampleTargets.png');  // TODO: change when we update template
			allExampleTargets['practice'] = gorilla.stimuliURL('birdExampleTargets.png');
			allExampleTargets['F'] = gorilla.stimuliURL('faceExampleTargets.png');
			allExampleTargets['P'] = gorilla.stimuliURL('pareidoliaExampleTargets.png');
			allExampleTargets['O'] = gorilla.stimuliURL('flowerExampleTargets.png');
			allExampleTargets['all'] = gorilla.stimuliURL('allTargetsExample.png')

          // put all image URLs into a single vector for preloading
          const allImageURLs: ImageStruct[] = [
              ...allDistractorURLs,
              ...allWatchURLs,
              ...allFaceURLs,
              ...allPareidoliaURLs,
              ...allObjectURLs,
			  ...allPracticeTargetImages,
			  ...Object.keys(allExampleTargets).map(k => allExampleTargets[k]) // URLs from example targets.  Object.values(...) is not stabalised
          ];

          console.log("There are " + allImageURLs.length + " images preloaded")

          machine.transition(State.PreloadStimuli, allImageURLs);
      });
    } // end onEnter
  }) // end addState PreloadStimuli

	SM.addState(State.PreloadStimuli, {
		onEnter: (machine: stateMachine.Machine, allImageURLs: string[]) => {
			gorilla.populateAndLoad('#gorilla', 'allstim', {
				loadingMessage: exprState.imageLoadingMessage,
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
				consentform: gorilla.resourceURL(exprState.consentFilename)
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
				exampleWatches: allExampleTargets['watch'],  // TODO: This will also need to be changed when you redo the template files
				exampleTargets: allExampleTargets['all'],
				imSize: exprState.exampleImageSize,
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

	SM.addState(State.PracticeInstructions, {
	    onEnter: (machine: stateMachine.Machine) => {
			$('#gorilla').hide();
	        gorilla.populateAndLoad($('#gorilla'), 'practice-instructions', {
				example: allExampleTargets['practice'],
				imSize: exprState.exampleImageSize,
		   	}, (err) => {
				$('#gorilla').show();
				$('#start-button').one('click', (event: JQueryEventObject) => {
					// transition to the practice trials
					machine.transition(State.PracticeBlockInitialiser);
				}) // end on click start button
			}); // end populateAndLoad
	    } // end onEnter
	}) // end addState PracticeInstructions

	SM.addState(State.PracticeBlockInitialiser, {
	    // this state constructs everything needed for a single block
	    onEnter: (machine: stateMachine.Machine) => {
	        // construct tT array
	        var t2TargetsArray: ImageStruct[] = practiceT2Images;
	        var imageTypeHR: string = 'a bird';

	        var t2DisplayPotentialArray: number[] = utils.constructNumberArray(1, exprState.nPracticeT1Images); // whether or not T2 is displayed
	        var t2DisplayGapOptions: number[] = utils.constructNumberArray(1, exprState.nPracticeT2Images);

	        let blockStruct = {
	            trialCounter: 0,
	            t1TargetsArray: practiceT1Images,
	            t2DisplayPotentialArray: t2DisplayPotentialArray,
	            t2DisplayGapOptions: t2DisplayGapOptions,
	            t2TargetsArray: t2TargetsArray,
	            trialArrayURLs: [],
	            t2PosGap: 0,
	            t2Condition: TargetCondition.None,
				thisTrialStruct: {} as TrialStruct,
				t1Image: "",
				t2Image: "",
	        } as BlockStruct

			// $('#start-button').one('click', (event: JQueryEventObject) => {
			machine.transition(State.PracticeBlock, blockStruct);
			// }) // end on keypress
	    }, // end onEnter State.BlockInitialiser
	}) // end addState State.BlockInitialiser

	SM.addState(State.PracticeBlock, {
	    // this state determines whether or not to go to the next block, do another trial, or finish
	    onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
	        if (blockStruct.t1TargetsArray.length === 0 && blockStruct.t2DisplayGapOptions.length === 0 && blockStruct.t2TargetsArray.length === 0) {
	            /// then our block is over
	            machine.transition(State.PostPracticeBreak)
	        } else {
	            // if our trial is not over yet
			    machine.transition(State.PracticePreTrial, blockStruct)
	        }
	    }, // end onEnter State.Block
	}) // end addState State.Block

	SM.addState(State.PracticePreTrial, {
	    onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
          console.log("======================================================");

	        // increment trail counter (needed for breaks)
	        blockStruct.trialCounter++;

	        // initialise distractor array
	        var trialArrayURLs: string[] = [];

	        var t1ImageURL: string = '';
	        t1ImageURL = utils.takeRand(blockStruct.t1TargetsArray);
	        console.log("T1 image has been chosen: " + t1ImageURL);
	        console.log("T1 image possibilities left are " + blockStruct.t1TargetsArray);

	        // choose whether or not T2 is displayed
	        const t2DeterministicNumber: number = utils.takeRand(blockStruct.t2DisplayPotentialArray)
	        if (t2DeterministicNumber % 2 == 0) {
	            // do not display T2
	            console.log("T2 image is not being displayed");
	            blockStruct.t2Condition = TargetCondition.Absent;
	            // construct random distractor array
	            trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 1);
	            const randomInsertIndex: number = utils.randInt(0, nInImageSequence - 1);
	            // insert T1 into trial array
	            utils.insert(trialArrayURLs, randomInsertIndex, t1ImageURL);
	            // be sure to redefine the position gap for metric recording
	            blockStruct.t2PosGap = 0;
	        } else {
	            // display T2; more complex choices to make (what T2 is)
	            blockStruct.t2Condition = TargetCondition.Present;
	            const t2ImageURL: string = utils.takeRand(blockStruct.t2TargetsArray);
	            console.log("We are going to display T2");
	            console.log("T2 image has been chosen: " + t2ImageURL);
	            console.log("T2 image possibilities left are " + blockStruct.t2TargetsArray);
	            // construct random distractor array
	            trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 2);

	            // choose T2 image gap
	            const t2ImageTypeNumber: number = utils.takeRand(blockStruct.t2DisplayGapOptions);
	            var t2PosGap: number;
	            console.log('Image number type is' + (t2ImageTypeNumber % 3));
	            const t2ImageTypeNumberModulo: number = t2ImageTypeNumber % lagPositions.length

				t2PosGap = lagPositions[t2ImageTypeNumberModulo];
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
	        machine.transition(State.PracticeTrial, blockStruct);
	    }, // end onEnter State.PreTrial
	}) // end addState State.PreTrial

	SM.addState(State.PracticeTrial, {
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
	                        machine.transition(State.PracticeT2SeenResponse, blockStruct);
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

	SM.addState(State.PracticeT2SeenResponse, {
	    onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
	        gorilla.populateAndLoad($('#gorilla'), 't2-seen-response', {
	                imageType: blockStruct.blockTypeHR,  // TODO: L will need to change this here when she alters the block messages (probably just to delete)
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
	                    if (trial.responseIsAllowed(e)) {
                            // update keypress as we have just pressed the key!
                            keypressAllowed = false;
                            var correctResponse: boolean = false;

                            // check if key press was correct
          	                if (trial.responseIsCorrect(blockStruct, e)) {
          	                   // correct!
          	                   $('#gorilla')
          	                    .queue(function() {
          	                        $('.didYouSee').hide();
          	                        $('.response-instructions').hide();
          	                        $('.practice-feedback-correct').show();
          	                        gorilla.refreshLayout();
          	                        $(this).dequeue();
          	                    })
          	                    .delay(practiceFeedbackMessageLength)
          	                    .queue(function() {
          	                        $('.practice-feedback-correct').hide();
          	                        gorilla.refreshLayout();
                                    machine.transition(State.PracticeBlock, blockStruct);
          	                        $(this).dequeue();
          	                    })
          	                } else {
          	                    // incorrect response
          	                    $('#gorilla')
          	                    .queue(function() {
          	                        $('.didYouSee').hide();
          	                        $('.response-instructions').hide();
          	                        $('.practice-feedback-incorrect').show();
          	                        gorilla.refreshLayout();
          	                        $(this).dequeue();
          	                    })
          	                    .delay(practiceFeedbackMessageLength)
          	                    .queue(function() {
          	                        $('.practice-feedback-incorrect').hide();
          	                        gorilla.refreshLayout();
                                    machine.transition(State.PracticeBlock, blockStruct);
          	                        $(this).dequeue();
          	                    })
          	                } // end if correct
	                    } // end checking if key pressed is K or L
	                }) // end response keypress

	            }); // end populate and load
	    } // end onEnter
	}) // end addState State.Response

	SM.addState(State.PostPracticeBreak, {
	    onEnter: (machine: stateMachine.Machine) => {
			// populate our trial screen
				gorilla.populateAndLoad($('#gorilla'), 'after-practice', {}, (err) => {
					// transition when required
					$('#start-button').one('click', (event: JQueryEventObject) => {
						machine.transition(State.BlockInitialiser);
					}) // end on keypress
				}) // end populate and load
	    } // end onEnter
	}) // end addState AfterPracticeInstructions

	SM.addState(State.BlockInitialiser, {
		// this state constructs everything needed for a single block
		onEnter: (machine: stateMachine.Machine) => {
		    // increment block counter
		    blockCounter++;

			// construct (potentially repeating; i.e., not unique) array of shuffled watches
			const watchURLsArray: string[] = utils.chooseNRand(allWatchURLs, nWatchImagesPerBlock);

			var t1TargetURLsArray: string[] = [];
			FaceURLsArray = utils.chooseNRand(constructURLArray(utils.constructNameArray(utils.constructNumberArray(1, nPracticeT1ImagesPerT1Type), 'Pface', '.' + stimExt)), nT1ImagesPerBlock);
			WatchURLsArray = utils.chooseNRand(constructURLArray(utils.constructNameArray(utils.constructNumberArray(1, nPracticeT1ImagesPerT1Type), 'Pwatch', '.' + stimExt)), nT1ImagesPerBlock);
			PareidoliaURLsArray = utils.chooseNRand(constructURLArray(utils.constructNameArray(utils.constructNumberArray(1, nPracticeT1ImagesPerT1Type), 'Ppareidolia', '.' + stimExt)), nT1ImagesPerBlock);
			t1TargetURLsArray = [
				...FaceURLsArray,
				...WatchURLsArray,
				...PareidoliaURLsArray
			];

			// construct tT array
			var t2TargetURLsArray: string[] = utils.takeNRand(allFlowerURLs, nT2ImagesPerBlock);  // TODO: initialise flower URLs

			var t2DisplayPotentialArray: number[] = utils.constructNumberArray(1, nT1ImagesPerBlock); // whether or not T2 is displayed
			var t2DisplayGapOptions: number[] = utils.constructNumberArray(1, nT2ImagesPerBlock);

			let blockStruct = {
        		trialCounter: 0,
				t1TargetsArray: watchURLsArray,
				t2DisplayPotentialArray: t2DisplayPotentialArray,
				t2DisplayGapOptions: t2DisplayGapOptions,
				t2TargetsArray: t2TargetURLsArray,
				trialArrayURLs: [],
				t2PosGap: 0,
				t2Condition: TargetCondition.None,
				thisTrialStruct: {} as TrialStruct,
				t1Image: "",
                t2Image: "",
			} as BlockStruct

			// display block instructions
			gorilla.populateAndLoad($('#gorilla'), 'block-instructions', {
				blockCounter: blockCounter,
				nBlocks: nBlocks,
				trialType: imageTypeHR,  // TODO: these will need to be changed as well (when changing the ෴ files)
				exampleTargets: allExampleTargets[blockType],
				imSize: exampleImageSize,
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
			machine.transition(...trial.nextState(blockStruct, exprState));
			if (blockStruct.t1TargetsArray.length === 0 && blockStruct.t2DisplayGapOptions.length === 0 && blockStruct.t2TargetsArray.length === 0) {
				/// then our block is over
				if (blockTypes.length === 0 && allFaceURLs.length == 0 && allObjectURLs.length == 0 && allPareidoliaURLs.length == 0) {
  					// if there are no other blocks remaining, finish
  					machine.transition(State.Debrief)
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
      		console.log("======================================================");

	    	// increment trail counter (needed for breaks)
	    	blockStruct.trialCounter++;

			// initialise distractor array
			var trialArrayURLs: string[] = [];

			var t1ImageURL: string = '';
			t1ImageURL = utils.takeRand(blockStruct.t1TargetsArray); // TODO: change t1TargetURLsArray to a list of objects as follows: ['https://...', ...] -> [{'https://...', 'Pface1.jpg', 'face'}]
			
			var t1ImageURLSplit: string[] = t1ImageURL.split('/');
            blockStruct.t1Image = t1ImageURLSplit[t1ImageURLSplit.length - 1];
			blockStruct.t1ConditionType.t1ConditionType = blockStruct.t1Image; // TODO: specify image type of t1 for metrics
            
			console.log("T1 image has been chosen: " + t1ImageURL);
			console.log("T1 image possibilities left are " + blockStruct.t1TargetsArray);

			// choose whether or not T2 is displayed
			const t2DeterministicNumber: number = utils.takeRand(blockStruct.t2DisplayPotentialArray)
			if (t2DeterministicNumber % 2 == 0) {
				// do not display T2
				console.log("T2 image is not being displayed");
				blockStruct.t2Condition = TargetCondition.Absent;
				// construct random distractor array
				trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 1);
				const randomInsertIndex: number = utils.randInt(0, nInImageSequence - 1);
				// insert T1 into trial array
				utils.insert(trialArrayURLs, randomInsertIndex, t1ImageURL);
		        // be sure to redefine the position gap for metric recording
		        blockStruct.t2PosGap = 0;
		        blockStruct.t2Image = ""
			} else {
				// display T2; more complex choices to make (what T2 is)
				blockStruct.t2Condition = TargetCondition.Present;
				const t2ImageURL: string = utils.takeRand(blockStruct.t2TargetsArray);
				console.log("We are going to display T2");
				console.log("T2 image has been chosen: " + t2ImageURL);
				console.log("T2 image possibilities left are " + blockStruct.t2TargetsArray);
				// construct random distractor array
				trialArrayURLs = utils.chooseNUniqueRand(allDistractorURLs, nInImageSequence - 2);

               var t2ImageURLSplit: string[] = t2ImageURL.split('/')
               blockStruct.t2Image = t2ImageURLSplit[t2ImageURLSplit.length - 1]


				// choose T2 image gap
				const t2ImageTypeNumber: number = utils.takeRand(blockStruct.t2DisplayGapOptions);
				var t2PosGap: number;
				console.log('Image number type is' + (t2ImageTypeNumber % 3));
				const t2ImageTypeNumberModulo: number = t2ImageTypeNumber % lagPositions.length;

				t2PosGap = lagPositions[t2ImageTypeNumberModulo];
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
						machine.transition(State.T2SeenResponse, blockStruct);
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
			            if (trial.responseIsAllowed(e)) {
							gorilla.stopStopwatch();

							// IMPORTANT: get response time!
							// This is the main metric!
							const responseTime: number = gorilla.getStopwatch();

							// update keypress as we have just pressed the key!
							keypressAllowed = false;
							var correctResponse: boolean = false;

							// check if key press was correct
							if (trial.responseIsCorrect(blockStruct, e)) {
								// correct!
								correctResponse = true;
							} else {
								// incorrect response
							}

							const t2ResponseAsString: string = String.fromCharCode(e)

							// Actually *store* the data!
							// IMPORTANT: these keys had to be imported into the `Metircs` tab!
							gorilla.metric({
								t1_condition: blockStruct.t1ConditionType.t1ConditionType,
								t2_category: blockStruct.blockType,
								t2_condition: blockStruct.t2Condition,
								t2_position_gap: blockStruct.t2PosGap,
								t2_response_correct: correctResponse,
								t2_response_key: t2ResponseAsString,
								t2_response_time:  responseTime,
								age: participantAge,
								id: participantID,
								gender: participantGender,
								t1_image: blockStruct.t1Image,
								t2_image: blockStruct.t2Image,
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

 SM.addState(State.Debrief, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'debrief', {
				debriefform: gorilla.resourceURL(debriefFilename)
			});
			gorilla.refreshLayout();
			$('#next-button').one('click', (event: JQueryEventObject) => {
				gorilla.finish();
			}) // end on keypress
		}
	}) // end addState State.Debrief

	// this is the state we enter when we have finished the task
	SM.addState(State.Finish, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'finish', {});
			gorilla.refreshLayout();
			$('#next-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Debrief);
			})
		} // end onEnter
	}) // end addState Finish

	// calling this function starts gorilla and the task as a whole
	gorilla.run(function () {
        SM.start(State.PreloadArrays);
	}) // end gorilla run
}) // end gorilla ready
