import gorilla = require('gorilla/gorilla');
import stateMachine = require("gorilla/state_machine");

import utils = require('utils');

const nImagesInGrid: number = 25;
var stimConditions: string[] = ['D', 'C', 'F', 'HF', 'LF'];
const fixationLength: number = 500;
const afterFixationLength: number = 500;

/* ------------------------------------- */

// possible states in state machine
enum State {
	Instructions,
	Block,
	Trial,
	Finish,
}

var GorillaStoreKeys = {
	CurrentTrialNo: 'currentTrialNo',
	CurrentRoundNumber: 'currentRoundNumber',
	Finished: 'finished'
}

gorilla.ready(function(){
	// initialise state machine
	var SM = new stateMachine.StateMachine();
	// start at trial one
	var trial_number: number = 1;
	var finishedFlag: boolean = gorilla.retrieve(GorillaStoreKeys.Finished, false);

	// In this state we will display our instructions for the task
	SM.addState(State.Instructions, {
		onEnter: (machine: stateMachine.Machine) => {
			var text: string = "Hello and welcome to this experiment.  It is the love child of genius people."
			gorilla.populate('#gorilla', 'instructions', {introduction: text});
			gorilla.refreshLayout();
			$('#start-button').one('click', (event: JQueryEventObject) => {
				machine.transition(State.Trial);
			}) // end on click start button
		} // end onEnter
	}) // end addState

	var blockArray = utils.constructBlockArray();

	// in this state, an array of images will be displayed and a response button
	// will be pressed
	SM.addState(State.Trial, {
		// the onEnter functions is executed when a state is entered
		onEnter: (machine: stateMachine.Machine) => {
			const randomCondition: string = utils.randVal(stimConditions); // previously takeRand
			var trialArray: string[] = [];
			var currentTrial: number = 0;
			const randTrial: number = utils.takeRand(blockArray);
			console.log(randTrial);

			// some metrics for later
			const condType = utils.encodeTargetType(randomCondition);
			const blockCode: number = utils.getCondCode(randomCondition);

			// initialising some metrics
			var randomTargetImage = null;
			var isPresent: boolean = false;

			// hide so that all images are generated at the same time
			if (randTrial % 2 == 0) {
				// generate a list of 25 random distractors
				// Construct 25 random distractor urls
				const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid);
				var randomDistractorURLs: string[] = [];
				for (var i = 0; i < randomDistractors.length; i++) {
					const distractorURL: string = gorilla.stimuliURL(randomDistractors[i]);
					randomDistractorURLs.push(distractorURL);
				}

				// update trialArray with array of distractors
				var trialArray: string[] = randomDistractorURLs;
			} else {
				// choose from list of targets and append to the 24 distractor images
				// Construct 24 random distractor urls
				const randomDistractors: string[] = utils.generateDistractorArray(nImagesInGrid - 1);
				var randomURLs: string[] = [];
				for (var i = 0; i < randomDistractors.length; i++) {
					const distractorURL: string = gorilla.stimuliURL(randomDistractors[i]);
					randomURLs.push(distractorURL);
				}

				// add random condition url to a random place in the array
				const randomConditionImage: string = utils.constructRandImageName(randomCondition);
				const randomConditionImageURL: string = gorilla.stimuliURL(randomConditionImage);
				utils.insertAtRandom(randomURLs, randomConditionImageURL);
				console.log(randomCondition);
				console.log(randomConditionImage);
				// update trialArray with array of distractors plus one random target
				var trialArray: string[] = randomURLs;
				// update target image name
				var randomTargetImage: any = randomConditionImage;
				// update isPresent variable (i.e., target has been shown)
				var isPresent: boolean = true;

				// TODO:
				// Insert at random then DO NOT REPEAT POSITION
			} // end if

			// hide the display till the images are loaded
			$('#gorilla').hide();

			// populate our trial screen
			gorilla.populateAndLoad($('#gorilla'), 'exp', { trials: trialArray }, (err) => {
				/*
				// Display the fixation cross
				$('#gorilla')
				.queue(function () {
				$('.gorilla-fixation-cross').show();
				gorilla.refreshLayout();
				$(this).dequeue();
				})// end queue for '#gorilla'
				.delay(fixationLength)
				.queue(function () {
				$('.gorilla-fixation-cross').hide();
				gorilla.refreshLayout();
				$(this).dequeue();
				}) // end queue for '#gorilla'
				.delay(afterFixationLength);
				*/  

				// display array of images
				$('#gorilla')
				    .queue(function () {
				        // $('.trial-array').show();
				        $('#gorilla').show();
				        gorilla.refreshLayout();
				        $(this).dequeue();
				    }) // end queue for '#gorilla'

				$('.response-button').on('click', (event: JQueryEventObject) => {
					gorilla.metric({
						trialNo: trial_number,
						trial_condition: isPresent, // present or absent trial; previously "condition1"
						target_condition: condType, // type of condition; previously "condition2"
						target_img: randomTargetImage, // the name of the taget image (or null); previously "stim1"
						target_location: null,
						key: null, // the response key for this trial
						correct: null, // boolean; whether correct or not
						response_time: null, // response time
						reponse_time: null,
					}) // end metric

					// increment trial number
					trial_number++;
					gorilla.store(GorillaStoreKeys.CurrentTrialNo, trial_number);

					// move on transition
					$('#gorilla')
						.queue(function () {
							machine.transition(State.Trial);
							$(this).dequeue();
						}); // end queue for '#gorilla'
				}) // end response button on click (event: JQueryEventObject)

			}) // end populate and load
		}, // end onEnter

		// The onExit function is executed whenever a state is left.  
		// It is the last thing a state will do
		onExit: (machine: stateMachine.Machine) => {
			if (blockArray.length === 0) {
				console.log("blockArray is now empty!");
				var trialFinished: boolean = true;
				gorilla.store(GorillaStoreKeys.Finished, trialFinished);
				machine.transition(State.Finish);
			} // end if
		} // end onExit
	}); // end addState

	// this is the state we enter when we have finished the task
	SM.addState(State.Finish, {
		onEnter: (machine: stateMachine.Machine) => {
			gorilla.populate('#gorilla', 'finish', {});
			gorilla.refreshLayout();
			$('#finish-button').one('click', (event: JQueryEventObject) => {
				gorilla.finish();
			})
		} // end onEnter
	}) // end addState

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
