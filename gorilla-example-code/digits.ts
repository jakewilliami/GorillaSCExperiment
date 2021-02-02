// Digit Span
// Here, we import any additional modules required to run the task
// All tasks will need to import 'gorilla', as gorilla provides the basic functionality for running the task
// and also for interacting with its manipulations and uploading metrics
// NOTE: this is an important change form the previous editor - the strings here are much simplier!
import gorilla = require("gorilla/gorilla");

// Our statemachine allows us to control what 'state' or section of the task we are in
// This is simlar to the functionality of the spreadsheet and 'displays' in the task builder
import stateMachine = require("gorilla/state_machine");

enum State {
    Instructions,
    Trial,
    Finish,
}

var ManipulationsKeys = {
    TaskType: 'taskType',
    DigitDirection: 'digitDirection',
    Trials: 'noOfTrials',
    Start: 'start',
    FixationLength: 'fixationLength',
    DigitLength: 'digitLength',
    FixNoOfRounds: 'fixNoOfRounds',
    FeedBack: 'giveFeedback',
}

var GorillaStoreKeys = {
    CurrentTrialNo: 'currentTrialNo',
    CurrentDigitLength: 'currentDigitLength',
    CurrentIndex: 'currentIndex',
    CurrentRoundNumber: 'currentRoundNumber',
    Finished: 'finished'
}

// Nomenclature
// Trial - a single iteration of the digitspan task i.e. one display of digits with a response
// the digitspan task can be set to run for a maximum number of trials

// Round - in the 'Fixed' mode, a round represents a set of trials at a fixed digit length
// If we wanted to display each length of digit for three trials then the manipulation fixNoOfRounds
// would be set to 3.

// gather all our manipulations
var taskType = gorilla.manipulation(ManipulationsKeys.TaskType, 'Fixed');
var NoOfTrials = gorilla.manipulation(ManipulationsKeys.Trials, '3');
var DigitDirection = gorilla.manipulation(ManipulationsKeys.DigitDirection, 'Forward');
var Start = gorilla.manipulation(ManipulationsKeys.Start, '2');
var FixationLength = gorilla.manipulation(ManipulationsKeys.FixationLength, '500');
var DigitLength = gorilla.manipulation(ManipulationsKeys.DigitLength, '500');
var FixNoOfRounds = gorilla.manipulation(ManipulationsKeys.FixNoOfRounds, '3');
var Feedback = (gorilla.manipulation(ManipulationsKeys.FeedBack, 'Yes') == 'Yes') ? true : false;

// gather any previously stored data
// currentTrialNo stores the current trial number we are on
var currentTrialNo = gorilla.retrieve(GorillaStoreKeys.CurrentTrialNo, 1);
// currentDigitLength stores the current length of digit being displayed
var currentDigitLength = gorilla.retrieve(GorillaStoreKeys.CurrentDigitLength, Start);
// currentRoundNumber, in the 'Fixed' mode, stores the current trial number within a round
var currentRoundNumber = gorilla.retrieve(GorillaStoreKeys.CurrentRoundNumber, 1);
// finishedFlag indicates whether or not the task has been finished.
var finishedFlag = gorilla.retrieve(GorillaStoreKeys.Finished, false);

//set the flag for an adaptive task
var adaptiveFlag = (taskType == 'Adaptive') ? true : false;

// In this function we create the logic for our task: it's states and functionality
gorilla.ready(()=> {

    // attach the responsive resizing logic to the container
    // this allows the contents of the screen to resize, depending on the size of the browser window
    gorilla.responsiveFrame('#gorilla');

    var SM = new stateMachine.StateMachine();
    
    // In this state, we will display our instructions for the task
    // these will need to change depending on whether we want the digits entered in the forward or reversed order
    SM.addState(State.Instructions, {
        // The onEnter functions is executed when a state is entered.  It is the first thing a state will do.
        onEnter: (machine: stateMachine.Machine) => {
            var text = (DigitDirection == 'Forward') ? "repeat the digits in the SAME order" : "repeat the digits in the REVERSED order";
            gorilla.populate('#gorilla', 'instructions', { OrderText: text });
            gorilla.refreshLayout();
            $('#start-button').one('click', (event: JQueryEventObject) => {
                machine.transition(State.Trial);
            });
        }
    })
    
    // in this state, the digits will be displayed and the response panel will be accessible
    SM.addState(State.Trial, {
        onEnter: (machine: stateMachine.Machine) => {
            var numberSet = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            
            // Choose the digits that will be displayed to the participant
            // This needs a no. of digits equal to our current digit length
            var trialArray = [];
            for(var i = 0; i< currentDigitLength; i++) {
                var numberIndex = randomIntFromInterval(0, 9 - trialArray.length);
                trialArray.push(numberSet[numberIndex]);
                numberSet.splice(numberIndex, 1);
            }
            
            // Choose the correct answers - either the trial array, or the trial array reversed 
            var answerArray = [];
            if (DigitDirection == 'Forward') { // Forward, the correct answers are the trial array
                answerArray = trialArray;
            } else { // Backward, the correct answers are the trial array REVERSED
                for(var j = trialArray.length - 1; j > -1; j--){
                    answerArray.push(trialArray[j]);
                }
            }
            
            // Populate our trial screen
            gorilla.populate('#gorilla', 'trial', {});
            // hide the main bits of our display
            $('.numberDisplay').hide();
            $('.gorilla-fixation-cross').hide();
            gorilla.refreshLayout();
            
            // if the screen refreshes we always want to start from 0
            var currentIndex = 0;
            
            // Display the fixation cross
            $('#gorilla')
                    .queue(function(){
                        $('.gorilla-fixation-cross').show();
                        gorilla.refreshLayout();
                        $(this).dequeue();
                    })
                    .delay(FixationLength)
                    .queue(function(){
                        $('.gorilla-fixation-cross').hide();
                        gorilla.refreshLayout();
                        $(this).dequeue();
                    })
                    .delay(500);
            
            // Display the numbers to the participant
            
            // this function displays a number on the screen, cycling through each element in our trial array
            // the function is recursive, calling it self again and again until we have displayed all of the trial numbers
            // the function takes an arguement referred to as a callback
            // - this is a function that can be executed by calling it
            function numberDisplay(callback){   
                $('#gorilla')
                    .queue(function(){
                        $('.numberDisplay').show();
                        $('.numberDisplay').html(trialArray[currentIndex]);
                        gorilla.refreshLayout();
                        $(this).dequeue();
                    })
                    .delay(DigitLength)
                    .queue(function() {
                        currentIndex++;
                        $('.numberDisplay').hide();
                        gorilla.refreshLayout();
                        $(this).dequeue();
                    })
                    .delay(500)
                    .queue(function() {
                        if(currentIndex < trialArray.length){
                            numberDisplay(callback);
                        }
                        else {
                            // we've finished displaying all the numbers now, so we want o execute our callback function
                            callback();
                        }
                        $(this).dequeue();
                    });
            }
            
            // once the display of numbers has been completed, we run the function below
            numberDisplay( function() {
                // Indicate the number of digits we are expecting
                var answerIndex = 0;
                var responseTextArray = [];
                var responseText = '';
                for(var i=0; i<currentDigitLength; i++){
                    responseTextArray.push('<span style="width: 70px; display:inline-block;">_</span>');
                    responseText += responseTextArray[i];
                }
                
                $('.numberDisplay').show();
                $('.numberDisplay').html(responseText);
                gorilla.refreshLayout();
                
                var responseSet = [];
                var setCorrect = true;
                var totalCorrect = 0;
                
                $('.c-answer-button').on('click', (event: JQueryEventObject) => {
                    // begin with logic to display digit on screen
                    var answer = $(event.currentTarget).data('answer');
                    responseSet.push(answer);
                    responseTextArray[answerIndex] = '<span style="width: 70px; display:inline-block;">' + answer + '</span>';
                    responseText = '';
                    for(var i=0; i<responseTextArray.length; i++){
                        responseText+= responseTextArray[i];
                    }  
                    
                    $('.numberDisplay').html(responseText);
                    gorilla.refreshLayout();
                    
                    // Check whether the digit is correct
                    var instanceCorrect = (answer == answerArray[answerIndex]) ? true : false;
                    if(instanceCorrect){
                        totalCorrect++;
                    } 
                
                    answerIndex ++;
                    // if we have reached the final number of the answer array
                    if (answerIndex >= answerArray.length) {
                        $("input[type=button]").attr("disabled", "disabled");
                        
                        // if we have gotten any answers wrong, we need to acknowledge that the set was incorrect
                        if(totalCorrect != answerArray.length) {
                            setCorrect = false;
                        }
                        
                        if(Feedback) {
                            if(setCorrect){
                                $('.feedback-correct').show();
                            } else {
                                $('.feedback-incorrect').show();
                            }
                        }
                        
                        gorilla.refreshLayout();
                        
                        gorilla.metric({
                            target: answerArray,
                            response: responseSet,
                            length: answerArray.length,
                            correct: setCorrect,
                            totalCorrect: totalCorrect,
                        });
                        
                        currentTrialNo++;
                        gorilla.store(GorillaStoreKeys.CurrentTrialNo, currentTrialNo);
                        
                        // Logic to determine what happens in the next round
                        // This depends on whether we are fixed or adapative and whether we were correct or wrong
                        if(!adaptiveFlag) {
                            // need to check if we've reached the end of a round, if so, increase digit length
                            if(currentRoundNumber >= FixNoOfRounds){
                                currentRoundNumber = 1;
                                currentDigitLength++;
                                gorilla.store(GorillaStoreKeys.CurrentDigitLength, currentDigitLength);
                            } else {
                                currentRoundNumber++;
                            }
                            gorilla.store(GorillaStoreKeys.CurrentRoundNumber, currentRoundNumber);
                        } else if(adaptiveFlag){
                            if(setCorrect){    
                                currentDigitLength++;
                            } else {
                                currentDigitLength = Math.max(currentDigitLength - 1, Start);
                            }
                            gorilla.store(GorillaStoreKeys.CurrentDigitLength, currentDigitLength);   
                        } 
                        
                        // add a small delay so that the final entered number is briefly displayed before moving on
                        $('#gorilla')
                            .delay(500)
                            .queue(function(){
                                machine.transition(State.Trial);
                                $(this).dequeue();
                            });
                    }
                });
            });
        },
        // The onExit function is executed whenever a state is left.  It is the last thing a state will do
        onExit: (machine: stateMachine.Machine) => {
            // we want to check if we've reached the maximum allowed number of trials.  If we have, we finish the task
            if(currentTrialNo > NoOfTrials) {
                finishedFlag = true;
                gorilla.store(GorillaStoreKeys.Finished, finishedFlag);
                machine.transition(State.Finish);
            }
        }
    })
   
   // this is the state we enter when we have finished the task
   SM.addState(State.Finish, {
       onEnter: (machine: stateMachine.Machine) => {
           gorilla.populate('#gorilla', 'finish', {});
           gorilla.refreshLayout();
           $('#finish-button').one('click', (event: JQueryEventObject) => {
                gorilla.finish();
            });
           
       }
   })
   
   // calling this function starts gorilla and the task as a whole
   gorilla.run(function() {
       // if we refreshed the page, having finished the task, we want to go back to the finish screen, not the instructions
        if(!finishedFlag) {
            SM.start(State.Instructions);
        } else {
            SM.start(State.Finish);
        }
   });
})

function randomIntFromInterval(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}

