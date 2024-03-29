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
// 30 images, each shown 3 times -> 90 present, 1/3rd absent so 45 absent

// define some global variables
// var stimConditions: string[] = ['O', 'F', 'HF', 'LF'];
var stimConditions: string[] = ['O', 'F', 'P']; // O for object, which are flowers
const presentResponseKey: string = 'p'
const absentResponseKey: string = 'a'
const beforeFixationDelay: number = 500;
const fixationLength: number = 500;
const afterFixationDelay: number = 0;
const rawPresentationTime: number = 8000; // previously 5000
const presentationTime: number = rawPresentationTime + beforeFixationDelay + fixationLength + afterFixationDelay;
// const presentationTime: number = rawPresentationTime;
const timeoutMessageLength: number = 1000;
const practiceFeedbackMessageLength: number = 2000; // previously 1000
const exampleImSize: string = "3cm"; // e.g., example images will be 3cm × 3cm
const loadingMessage: string = 'Please wait while the experiment is loading.  This may take some time.';
const consentFilename: string = "VS_consent.pdf"; // these are in the Resources tab
const debriefFilename: string = "VS_debrief.pdf";
const nColsInGrid: number = 8; // 9
const nRowsInGrid: number = 8; // 6
const possibleImagesInGrid: number[] = [16, 24, 36];
const imageExt: string = 'png'; // utils.imageExt
const nDistractors: number = 500;
const nUniqueTargetsPerBlock: number = 30;
const preTargetPrimedDelay: number = 0;
const targetPrimedLength: number = 1600;
const postTargetPrimedDelay: number = 0;

const exampleImages: Object = {
	'A': 'allTargetsExample.png', // all
    'O': 'flowerExampleTargets.png', // Object
    'F': 'faceExampleTargets.png',
    'B': ['B1.png', 'B2.png', 'B3.png', 'B4.png', 'B5.png', 'B6.png'], // practice (birds)
	'P': 'pareidoliaExampleTargets.png', // pareidolia
};

/* ------------------------------------- */
// There is not much that you should need
// to change below this line!
/*--------------------------------------*/

/* // Back when we were doing dynamic grid sizes
const imgContainerSizeInPixels: number = 106;

const vw: number = Math.floor(0.9 * Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0));
const vh: number = Math.floor(0.9 * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0));

const nColsInGrid: number = Math.floor(vw / imgContainerSizeInPixels);
const nRowsInGrid: number = Math.floor(vh / imgContainerSizeInPixels);
*/

const nGridPositions: number = nColsInGrid * nRowsInGrid;
// const nBlankPositions: number = nGridPositions - 25; // SHOULD USE utils.nImagesInGrid
const invisibleImageB64Encoded: string = 'R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
const invisibleImage: string = 'data:image/gif;base64,' + invisibleImageB64Encoded;
// const invisibleImage: string = '';

// possible states in state machine
enum State {
	PreloadArrays,
	PreloadStimuli,
	Consent,
	RequestFullscreen,
	Demographics,
	Instructions,
	PracticeInstructions,
	PracticeTrial,
	PracticeTargetPrimer,
	PracticeFixationCross,
	PracticeImageArray,
	AfterPracticeInstructions,
	Trial,
	TargetPrimer,
	FixationCross,
	ImageArray,
	Block,
	Debrief,
	Finish,
}

// our TrialStruct struct, which contains information
// about a trial, to be passed to different states
interface TrialStruct {
	nImagesInGrid: number,
	trialArray: string[],
	// primerImages: string[],
	humanReadableTrialArray: string[],
	trialCondition: string,
	isPresent: boolean,
	isPresentString: string,
	targetConditionCoded: number,
	targetImg: string,
	primerImage: string,
	targetLocation: number,
	key: string,
	correct: number,
	responseTime: number,
	timedOut: boolean,
	setSize: number,
	fixationCounter: number,
}

// As above, for different blocks
interface BlockStruct {
    targetType: string,
    blockArray: number[],
	primerImages: string[],
	possibleGridSizes: number[],
    // possibleTrialTargets: number[],
		possibleTrialTargets: Object,
    possibleTrialPositions: number[],
	possiblePresentGridSizes: number[],
	possibleAbsentGridSizes: number[],
}

// An interface to contain the above two
// interfaces
interface InformationStruct {
	trialStruct: TrialStruct,
	blockStruct: BlockStruct
}

interface PracticeTrialStruct {
	nImagesInGrid: number,
	practiceTargets: string[],
	practiceArrays: number[],
	practicePrimers: string[],
	practiceTarget: string,
	isPresent: boolean,
	primerImage: string,
	practiceTargetPositions: number[],
	practiceArray: string[]
	possiblePresentGridSizes: number[],
	possibleAbsentGridSizes: number[],
	fixationCounter: number,
}

// Given an array of stimuli names, constructs an array
// of stimuli URLs
function constructURLArray(stimArr: string[]) {
    var URLs: string[] = [];
	for (var i = 0; i < stimArr.length; i++) {
		var URI: string = stimArr[i];
		// if (URI.endsWith(imageExt, imageExt.length)) {
		if (URI.split('.').pop() == imageExt) {
			URI = gorilla.stimuliURL(URI);
		}
		URLs.push(URI);
	}

	return URLs;
}

function mutateCellElems(styleValue: string) {
	// const cellElements = document.getElementsByClassName('Cell');
	[].forEach.call(document.querySelectorAll('.CellImg'), (el) => {
		el.style.visibility = styleValue;
	});
	// for (var i: number = 0; i < cellElements.length; i++) {
	// 	(<HTMLInputElement>document.getElementById('CellImg' + i)).style.visibility = styleValue;
	// }
	return;
}
function hideTrialArray() {
	$('.Grid').hide();
	mutateCellElems('hidden');
	return;
}
function showTrialArray() {
	$('.Grid').show();
	mutateCellElems('visible');
	return;
}

// global boolean variable which we update in order to check
// if we are allowed to press the response key or not
var keypressAllowed: boolean = false;

// set counters
var trialNumber: number = 0;
var absentCount: number = 0;
var blockCounter: number = 0;

// number of blocks (for block.hbs' h1)
const nBlocks: number = stimConditions.length;

// need demographics to be global
var participantID: string;
var participantGender: string;
var participantAge: number;

// get keycode for response keys
const presentResponseKeyCode: number = presentResponseKey.toLowerCase().charCodeAt(0);
const absentResponseKeyCode: number = absentResponseKey.toLowerCase().charCodeAt(0);

//// INITIALISE URL LISTS BEFORE TASK BEGINS
// set number array for main target variables
var allFacesAsNumbers: number[];
var allObjectsAsNumbers: number[];
var allPareidoliaAsNumbers: number[];

// construct array of T2 images
var allFaceNames: string[];
var allObjectNames: string[];
var allPareidoliaNames: string[];

// initialise number array for main target variables as global
var allFaceURLs: string[];
var allObjectURLs: string[];
var allPareidoliaURLs: string[];
var allPracticeTargetURLs: string[];

// initialise URL array of all distractors as global
var allDistractorURLs: string[];

// set URL array of all distractors
var allDistractorNumbers: number[];
var allDistractorNames: string[];

// construct a number array to help determine which type of watch to display
var watchDisplayTypes: number[];

// primers
var primersAsNumbers: number[];
var primerURLs: string[];
var primerFaceURLs: string[];
var primerObjectURLs: string[];
var primerPareidoliaURLs: string[];
// var primerURLs: string[][];
var allPrimerImages: Object = {};

// all practice images
// var practiceDigitalURLs: string[];
// var practiceAnalogueURLs: string[];
// var practiceT1URLs: string[];
// var practiceT2URLs: string[];
var allPracticeTargetNames: string[];
var primerPracticeURLs: string[];

// this is the main gorilla function call!
gorilla.ready(function(){
    // initialise stopwatch
    gorilla.initialiseTimer();

	// initialise state machine
	var SM = new stateMachine.StateMachine();

	SM.addState(State.PreloadArrays, {
    onEnter: (machine: stateMachine.Machine) => {
      gorilla.populateAndLoad('#gorilla', 'loading', {
		  	loadingMessage: loadingMessage,
	  }, () => {
        	//// INITIALISE URL LISTS BEFORE TASK BEGINS
        	// set number array for main target variables
        	allFacesAsNumbers = utils.constructNumberArray(1, nUniqueTargetsPerBlock);
        	allObjectsAsNumbers = utils.constructNumberArray(1, nUniqueTargetsPerBlock);
        	allPareidoliaAsNumbers = utils.constructNumberArray(1, nUniqueTargetsPerBlock);
        	// construct array of T2 images
        	allFaceNames = utils.constructNameArray(allFacesAsNumbers, 'F', '.' + imageExt);
        	allObjectNames = utils.constructNameArray(allObjectsAsNumbers, 'O', '.' + imageExt);
        	allPareidoliaNames = utils.constructNameArray(allPareidoliaAsNumbers, 'P', '.' + imageExt);
        	// convert to URLs
        	allFaceURLs = constructURLArray(allFaceNames);
        	allObjectURLs = constructURLArray(allObjectNames);
        	allPareidoliaURLs = constructURLArray(allPareidoliaNames);

        	// set URL array of all distractors
        	allDistractorNumbers = utils.constructNumberArray(1, nDistractors);
        	allDistractorNames = utils.constructNameArray(allDistractorNumbers, 'D', '.' + imageExt)
        	allDistractorURLs = constructURLArray(allDistractorNames);
			
			// copy the targets for primer
			primerFaceURLs = [...allFaceURLs];
			primerObjectURLs = [...allObjectURLs];
			primerPareidoliaURLs = [...allPareidoliaURLs];
			
			allPrimerImages['F'] = [...primerFaceURLs];
			allPrimerImages['O'] = [...allObjectURLs];
			allPrimerImages['P'] = [...allPareidoliaURLs];

			// get practice targets
			// practiceDigitalURLs = constructURLArray(utils.constructNameArray(utils.constructNumberArray(1, 3), 'Pdigital', '.' + imageExt));
			// practiceAnalogueURLs = constructURLArray(utils.constructNameArray(utils.constructNumberArray(1, 3), 'Panalogue', '.' + imageExt));
			// practiceT1URLs = [...practiceDigitalURLs, ...practiceAnalogueURLs];
			// practiceT2URLs = constructURLArray(utils.generatePracticeArray('Bird'));
			// allPracticeTargetURLs = [
			// 	...practiceT1URLs,
			// 	...practiceT2URLs
			// ];
			allPracticeTargetNames = utils.generatePracticeArray();
			primerPracticeURLs = constructURLArray([...allPracticeTargetNames]);

			// add example target arrays as URLs to object
			// allExampleTargets['watch'] = gorilla.stimuliURL('watchExampleTargets.png');
			// allExampleTargets['practice'] = gorilla.stimuliURL('birdExampleTargets.png');
			// allExampleTargets['F'] = gorilla.stimuliURL('faceExampleTargets.png');
			// allExampleTargets['P'] = gorilla.stimuliURL('pareidoliaExampleTargets.png');
			// allExampleTargets['O'] = gorilla.stimuliURL('flowerExampleTargets.png');
			// allExampleTargets['all'] = gorilla.stimuliURL('allTargetsExample.png')

          // put all image URLs into a single vector for preloading
          const allImageURLs: string[] = [
              ...allDistractorURLs,
              // ...allDigitalWatchURLs,
              // ...allAnalogueWatchURLs,
              ...allFaceURLs,
              ...allPareidoliaURLs,
              ...allObjectURLs,
			  // ...allPracticeTargetNames,
			  ...primerPracticeURLs,
			  // ...primerURLs,
			  // ...Object.keys(allExampleTargets).map(k => allExampleTargets[k]) // URLs from example targets.  Object.values(...) is not stabalised
          ];

          console.log("There are " + allImageURLs.length + " images preloaded")

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

	// start at trial one
	// var trial_number: number = gorilla.retrieve('trial_number', 1, true);

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
				example: gorilla.stimuliURL(exampleImages['A']),
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

	SM.addState(State.PracticeInstructions, {
	    onEnter: (machine: stateMachine.Machine) => {
			var examples: string[] = constructURLArray(exampleImages['P']);
			// var possibleGridSizes: number[] = ;

			// populate the template
			console.log("PRACTICE PRIMER IMAGES: " + primerPracticeURLs);
			$('#gorilla').hide();
	        gorilla.populateAndLoad($('#gorilla'), 'practice-instructions', {
				example: gorilla.stimuliURL(utils.randVal(utils.generatePracticeArray())),
				imSize: exampleImSize
		   	}, (err) => {
				$('#gorilla').show();
				$('#start-button').one('click', (event: JQueryEventObject) => {
					// transition to the practice trials
					let practiceStruct = {
						practiceTargets: allPracticeTargetNames,
						practiceArrays: utils.constructPracticeArray(),
						practicePrimers: primerPracticeURLs,
						practiceTarget: '',
						primerImage: '',
						practiceTargetPositions: utils.constructTargetPositions(nGridPositions),
						possiblePresentGridSizes: utils.constructGridSizeDeterministicArray('practice'),
						possibleAbsentGridSizes: utils.constructGridSizeDeterministicArray('practice'),
						fixationCounter: 0,
					} as PracticeTrialStruct
					machine.transition(State.PracticeTrial, practiceStruct);
				}) // end on click start button
			}); // end populateAndLoad
	    } // end onEnter
	}) // end addState PracticeInstructions

	SM.addState(State.PracticeTrial, {
	    onEnter: (machine: stateMachine.Machine, practiceStruct: PracticeTrialStruct) => {
			// practiceStruct.practiceArray = [];
	        keypressAllowed = false;
			var trialArray: string[];
			// const gridSizeDeterministicNumber: number = utils.takeRand(practiceStruct.possibleGridSizes) % 3;
			// const nImagesInGrid: number = possibleImagesInGrid[gridSizeDeterministicNumber];
			// const nBlankPositions: number = nGridPositions - nImagesInGrid;
			// const gridSizeDeterministicNumber: number;
			// const nImagesInGrid: number;
			// const nBlankPositions: number;

			// if the practice trials are over, transition to post-practice instructions
	        if (practiceStruct.practiceArrays.length === 0) {
	            machine.transition(State.AfterPracticeInstructions);
	        } else {
	            var trialArray: string[] = [];
	            const randTrial: number = utils.takeRand(practiceStruct.practiceArrays);

	            if (randTrial % utils.practiceModuloVal == 0) {
	                // generate a list of 25 random distractors
	                // Construct 25 random distractor urls
					// utils.nPracticeTrials // number of trials overall
					const gridSizeDeterministicNumber: number = utils.takeRand(practiceStruct.possibleAbsentGridSizes) % 3;
					const nImagesInGrid: number = possibleImagesInGrid[gridSizeDeterministicNumber];
					const nBlankPositions: number = nGridPositions - nImagesInGrid;
	                const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid, nBlankPositions, invisibleImage);
					// console.log("THESE ARE THE DISTRACTORS: " + randomDistractors)
	                const randomDistractorURLs: string[] = constructURLArray(randomDistractors);
					// console.log("THESE ARE THE DISTRACTORS: " + randomDistractorURLs)

	                // update metrics
	                practiceStruct.isPresent = false;
					practiceStruct.primerImage = utils.randVal(practiceStruct.practicePrimers);
					console.log("Setting primer to random target: " + practiceStruct.primerImage);
					// practiceStruct.primerImage = "";
	                // practiceStruct.practiceArray = randomDistractorURLs;
					trialArray = randomDistractorURLs;
	            } else {
	                // choose from list of targets and append to the 24 distractor images
	                // Construct 24 random distractor urls
	                // const randomDistractors: string[] = utils.generateDistractorArray(utils.nImagesInGrid - 1);
					const gridSizeDeterministicNumber: number = utils.takeRand(practiceStruct.possiblePresentGridSizes) % 3;
					const nImagesInGrid: number = possibleImagesInGrid[gridSizeDeterministicNumber];
					const nBlankPositions: number = nGridPositions - nImagesInGrid;
					const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid - 1, nBlankPositions, invisibleImage); // remove one for target image
	                const randomURLs: string[] = constructURLArray(randomDistractors);

	                // choose a random image from the possible image set.  This image cannot be repeated
	                const practiceImage: string = utils.takeRand(practiceStruct.practiceTargets);
	                const conditionImageURL: string = gorilla.stimuliURL(practiceImage);

	                // insert image at random position.  This position cannot be repeated
	                const randPosition: number = utils.takeRand(practiceStruct.practiceTargetPositions);
	                utils.insert(randomURLs, randPosition, conditionImageURL)

					// update metrics
	                practiceStruct.isPresent = true;
					practiceStruct.primerImage = conditionImageURL;
					console.log("Setting primer to target image: " + practiceImage);
					// practiceStruct.primerImage = practiceImage;
	                // practiceStruct.practiceArray = randomURLs;
					trialArray = randomURLs;
	            } // end if

				// var trialArrayWithBlanks: string[] = trialArray;
				// console.log(nBlankPositions)
				// for (var i: number = 0; i < nBlankPositions; i++) {
				//     trialArray.push(invisibleImage);
				// }
				// utils.shuffle(trialArray);
				practiceStruct.practiceArray = trialArray;
				// console.log("trial array: ");
				// console.log(trialArray)


	            // hide the display till the images are loaded
	            // $('.Grid').hide();
				// $('.Cell').hide();
				hideTrialArray();
				// $('#gorilla').getElementById('trial-array-fs').style.display = 'none';
				// $('.Grid').toggle();
				// $('#Grid').toggle()
	            $('.instruction').hide();
	            $('.timeout-feedback').hide();
	            $('.practice-feedback-correct').hide();
	            $('.practice-feedback-incorrect').hide();

	            // populate our trial screen
	            gorilla.populateAndLoad($('#gorilla'), 'trial', {
					ncols: nColsInGrid,
					nrows: nRowsInGrid,
					trials: practiceStruct.practiceArray,
					responsePresent: presentResponseKey.toUpperCase(),
					responseAbsent: absentResponseKey.toUpperCase(),
					primerImage: practiceStruct.primerImage,
				}, (err) => {
	                machine.transition(State.PracticeFixationCross, practiceStruct);
	            }) // end populate and load
	        } // end if-else
	    }, // end onEnter
	}) // end addState PracticeTrial
	
	SM.addState(State.PracticeFixationCross, {
	    onEnter: (machine: stateMachine.Machine, practiceStruct: PracticeTrialStruct) => {
	        // $('.Grid').hide();
			hideTrialArray();
			// $('.Cell').hide();
			// $('.Grid').toggle();
			// console.log(document.getElementsByClassName('Cell'));
			// console.log(document.getElementById('Cell0'))
			// $('#Grid').toggle()
	        $('.instruction').hide();
	        $('.timeout-feedback').hide();
	        $('.practice-feedback-correct').hide();
	        $('.practice-feedback-incorrect').hide();
			
			// increment fixation primer so that we can dynamically use the same fixation state
			// practiceStruct.fixationCounter++;

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
			
			// console.log("FIXATION COUNTER: " + practiceStruct.fixationCounter);
			// console.log("FIXATION COUNTER: " + (practiceStruct.fixationCounter % 2));
			if ((practiceStruct.fixationCounter % 2) == 0) {
				machine.transition(State.PracticeTargetPrimer, practiceStruct)
			}
			else { // (practiceStruct.fixationCounter % 2) == 1
	        	machine.transition(State.PracticeImageArray, practiceStruct);
			}
	    }, // end onEnter
	}) // end addState for PracticeFixationCross
	
	SM.addState(State.PracticeTargetPrimer, {
		// targetPrimedLength, postTargetPrimedDelay
		onEnter: (machine: stateMachine.Machine, practiceStruct: PracticeTrialStruct) => {
			hideTrialArray();
			// $('.Cell').hide();
			// $('.Grid').toggle();
			// console.log(document.getElementsByClassName('Cell'));
			// console.log(document.getElementById('Cell0'))
			// $('#Grid').toggle()
	        $('.instruction').hide();
	        $('.timeout-feedback').hide();
	        $('.practice-feedback-correct').hide();
	        $('.practice-feedback-incorrect').hide();
			$('.target-primer').hide();
			
			// increment fixation primer so that we can dynamically use the same fixation state
			practiceStruct.fixationCounter++;
			
	        $('#gorilla')
	            .delay(preTargetPrimedDelay)
	            .queue(function () {
	                $('.target-primer').show();
	                gorilla.refreshLayout();
	                $(this).dequeue();
	            })// end queue for '#gorilla'
	            .delay(targetPrimedLength)
	            .queue(function () {
	                $('.target-primer').hide();
	                gorilla.refreshLayout();
	                $(this).dequeue();
	            }) // end queue for '#gorilla'
	            .delay(postTargetPrimedDelay);
			
			machine.transition(State.PracticeFixationCross, practiceStruct)
		} // end onEnter
	}) // end addState PracticeTargetPrimer

	SM.addState(State.PracticeImageArray, {
	    onEnter: (machine: stateMachine.Machine, practiceStruct: PracticeTrialStruct) => {
			// increment fixation primer so that we can dynamically use the same fixation state
			practiceStruct.fixationCounter++;
			
	        // initialise sequence for timeout
			var stateTimer: gorilla.GorillaTimerSequence;

	        $('#gorilla')
	            .queue(function () {
	                // $('.Grid').show();
					showTrialArray();
					// $('.Cell').show();
					// $('.Grid').toggle();
					// $('#gorilla').getElementById('trial-array-fs').style.display = 'grid';
					// $(document).getElementsByClassName("Grid")[0].style.visibility = 'visible';
					// $('#Grid').toggle()
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
	                        // $('.Grid').hide();
							hideTrialArray();
							// $('.Cell').hide();
							// $('.Grid').toggle();
							// $('#gorilla').getElementById('trial-array-fs').style.display = 'none';
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
	                        // $('.Grid').hide();
							hideTrialArray();
							// $('.Cell').hide();
							// $('.Grid').toggle();
							// $('#gorilla').getElementById('trial-array-fs').style.display = 'none';
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
	                // $('.Grid').hide();
					$('.Grid').toggle();
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
				// this is used to determine whether we have an absent or present trial
				var blockArray: number[] = utils.constructBlockArray();
				// var possibleTrialTargets: number[] = utils.constructTargetArray();
				// each target image needs to appear once per image size condition (i.e., once in a 16 image condition, once in a 36 image condition, and once in a 25 image condition)
				var possibleTrialTargets: Object = {}
				for (var i: number = 0; i < possibleImagesInGrid.length; i++) {
					const nImagesInGrid: number = possibleImagesInGrid[i];
					possibleTrialTargets[nImagesInGrid] = utils.constructTargetArray();
				}
				var possibleTrialPositions: number[] = utils.constructTargetPositions(nGridPositions);
				// NEEDS TO BE DYNAMIC FOR PRESENT TO ABSENT RATIO
				var possibleAbsentGridSizes: number[] = utils.constructGridSizeDeterministicArray('absent');
				var possiblePresentGridSizes: number[] = utils.constructGridSizeDeterministicArray('present');

				let blockStruct = {
					targetType: targetType,
					blockArray: blockArray,
					possibleTrialTargets: possibleTrialTargets,
					possibleTrialPositions: possibleTrialPositions,
					possiblePresentGridSizes: possiblePresentGridSizes,
					possibleAbsentGridSizes: possibleAbsentGridSizes,
					primerImages: allPrimerImages[targetType],
				} as BlockStruct;

				// populate our trial screen
				$('#gorilla').hide();
				const examples: string[] = utils.shuffle(exampleImages[targetType]);
				gorilla.populateAndLoad($('#gorilla'), 'block-instructions', {
				    blockCounter: blockCounter,
				    nBlocks: nBlocks,
					trialType: utils.encodeTargetTypeHR(targetType),
					example: gorilla.stimuliURL(exampleImages[targetType]),
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
			// var trialArray: string[];

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
					primerImage: null,
					targetLocation: null,
					key: null,
					correct: null,
					responseTime: null,
					timedOut: false,
					setSize: 0,
					fixationCounter: 0,
				} as TrialStruct;
				
				// trialStruct.primerImage = utils.takeRand(primerURLs);

				// if the random trial number is zero modulo some value,
				// then it should be a distractor.  This modulo value is defined
				// in utils, based on the proportion of trials you need
				if (randTrial % utils.moduloVal == 0) {
				    // increment absent counter
				    absentCount++;
					const gridSizeDeterministicNumber: number = utils.takeRand(blockStruct.possibleAbsentGridSizes) % 3;
					const nImagesInGrid: number = possibleImagesInGrid[gridSizeDeterministicNumber];
					const nBlankPositions: number = nGridPositions - nImagesInGrid;
					// Construct 25 random distractor urls
					const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid, nBlankPositions, invisibleImage);
					const randomDistractorURLs: string[] = constructURLArray(randomDistractors);

					// update trialArray with array of distractors
					trialStruct.trialArray = randomDistractorURLs;

				    // update metrics
					trialStruct.primerImage = utils.randVal(blockStruct.primerImages);
				    trialStruct.humanReadableTrialArray = randomDistractors;
					trialStruct.isPresent = false;
					trialStruct.isPresentString = 'absent';
					trialStruct.targetImg = 'absent' + absentCount;
					trialStruct.setSize = nImagesInGrid;
				} else {
					const gridSizeDeterministicNumber: number = utils.takeRand(blockStruct.possiblePresentGridSizes) % 3;
					const nImagesInGrid: number = possibleImagesInGrid[gridSizeDeterministicNumber];
					const nBlankPositions: number = nGridPositions - nImagesInGrid;
					// Construct 24 random distractor urls
					const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid - 1, nBlankPositions, invisibleImage); // remove one for target image
					const randomURLs: string[] = constructURLArray(randomDistractors);

					// choose a random image from the possible image set.  This image cannot be repeated
					const randomImageNumber: number = utils.takeRand(blockStruct.possibleTrialTargets[nImagesInGrid]) + 1; // add one because array is from 0:29
					// console.log("NOW WE HAVE THE FOLLOWING POSSIBLE TARGETS FOR IMAGE NUMBER " +nImagesInGrid + " : " + blockStruct.possibleTrialTargets[nImagesInGrid])

					const conditionImage: string = utils.constructStimName(blockStruct.targetType, randomImageNumber);
					const conditionImageURL: string = gorilla.stimuliURL(conditionImage);

					// insert image at random position.  This position cannot be repeated
					// const randPosition: number = utils.takeRand(blockStruct.possibleTrialPositions);
					const randPosition: number = utils.randInt(0, nGridPositions - 1) // we don't care about repeating target positions anymore because the array is presumable sufficiently large
					utils.insert(randomURLs, randPosition, conditionImageURL)

					// update metrics
					trialStruct.trialArray = randomURLs;
					trialStruct.humanReadableTrialArray = utils.insert(randomDistractors, randPosition, conditionImage);
					trialStruct.targetImg = conditionImage;
					trialStruct.primerImage = conditionImageURL;
					trialStruct.isPresent = true;
					trialStruct.isPresentString = 'present';
					trialStruct.targetLocation = randPosition;
					trialStruct.setSize = nImagesInGrid;
				} // end if

				// package all needed data into an information struct
				// for passing to different states.  Wrap this interface
				// in wrapping paper and put a bow on it
				let informationStruct = {
					blockStruct: blockStruct,
					trialStruct: trialStruct
				} as InformationStruct

				// hide the display till the images are loaded
				// $('.trial-array').hide();
				hideTrialArray();
				$('.instruction').hide();
				$('.timeout-feedback').hide();
				$('.practice-feedback-correct').hide();
	            $('.practice-feedback-incorrect').hide();

				// populate our trial screen
				gorilla.populateAndLoad($('#gorilla'), 'trial', {
					ncols: nColsInGrid,
					nrows: nRowsInGrid,
					trials: trialStruct.trialArray,
					responsePresent: presentResponseKey.toUpperCase(),
					responseAbsent: absentResponseKey.toUpperCase(),
					primerImage: trialStruct.primerImage,
				}, (err) => {
					machine.transition(State.FixationCross, informationStruct);
				}) // end populate and load
			} // end if-else
		} // end onEnter
	}); // end addState Trial

	SM.addState(State.FixationCross, {
		onEnter: (machine: stateMachine.Machine, informationStruct: InformationStruct) => {
			// $('.trial-array').hide();
			hideTrialArray();
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
			
			if ((informationStruct.trialStruct.fixationCounter % 2) == 0) {
				machine.transition(State.TargetPrimer, informationStruct)
			}
			else { // (practiceStruct.fixationCounter % 2) == 1
				machine.transition(State.ImageArray, informationStruct);
			}
		} // end onEnter
	}) // end addState for FixationCross
	
	SM.addState(State.TargetPrimer, {
		// targetPrimedLength, postTargetPrimedDelay
		onEnter: (machine: stateMachine.Machine, informationStruct: InformationStruct) => {
			hideTrialArray();
			// $('.Cell').hide();
			// $('.Grid').toggle();
			// console.log(document.getElementsByClassName('Cell'));
			// console.log(document.getElementById('Cell0'))
			// $('#Grid').toggle()
	        $('.instruction').hide();
	        $('.timeout-feedback').hide();
	        $('.practice-feedback-correct').hide();
	        $('.practice-feedback-incorrect').hide();
			$('.target-primer').hide();
			
			// increment fixation primer so that we can dynamically use the same fixation state
			informationStruct.trialStruct.fixationCounter++;
			
	        $('#gorilla')
	            .delay(preTargetPrimedDelay)
	            .queue(function () {
	                $('.target-primer').show();
	                gorilla.refreshLayout();
	                $(this).dequeue();
	            })// end queue for '#gorilla'
	            .delay(targetPrimedLength)
	            .queue(function () {
	                $('.target-primer').hide();
	                gorilla.refreshLayout();
	                $(this).dequeue();
	            }) // end queue for '#gorilla'
	            .delay(postTargetPrimedDelay);
			
			machine.transition(State.FixationCross, informationStruct)
		} // end onEnter
	}) // end addState TargetPrimer

	SM.addState(State.ImageArray, {
		onEnter: (machine: stateMachine.Machine, informationStruct: InformationStruct) => {
			// increment fixation primer so that we can dynamically use the same fixation state
			informationStruct.trialStruct.fixationCounter++;
			
			// initialise sequence for timeout
			var stateTimer: gorilla.GorillaTimerSequence;

			$('#gorilla')
				.queue(function () {
					// $('.trial-array').show();
					showTrialArray();
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
						setSize: informationStruct.trialStruct.setSize,
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
					// $('.trial-array').hide();
					hideTrialArray();
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
						setSize: informationStruct.trialStruct.setSize,
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
        // SM.start(State.RequestFullscreen);
				SM.start(State.PreloadArrays);
	}) // end gorilla run
}) // end gorilla ready
