// Here, we import any additional modules required to run the task
// All tasks will need to import 'gorilla', as gorilla provides the basic functionality for running the task
// and also for interacting with its manipulations and uploading metrics
import gorilla = require("../../../../cep/gorilla-client/client/public/gorilla-client/js/gorilla");

import stateMachine = require("../../../../cep/blueprint/client/public/blueprint/js/state_machine");

enum State {
    Instructions,
    Trial,
    Intermission,
    Finish,
}

// These create some easy links into the names of our manipulations and store keys
// If we decide to change the names of these keys, we only have to change them here, rather than throughout the code
var ManipulationsKeys = {
    BlockSize: "block_size",
    NoOfBlocks: "no_of_blocks",
    ColourOrWordFirst: "colour_word_first",
    Feedback: "feedback"
}

var GorillaStoreKeys = {
    CurrentTrial: "current_trial",
    CurrentBlock: "current_block",
    CurrentDataBlock: "current_data",
    CurrentReadOrSee: "cur_read_or_see",
    CurrentStage: "cur_stage",
    FinishedFlag: "finished_flag"
}

var ColourCodes = {
    RED: '#E61234',
    GREEN: '#33cc33',
    PINK: '#FF1493',
    BLUE: '#0033cc',
}

var Congruency = {
    Congruent: 'congruent',
    Incongruent: 'incongruent',
}

// Here we give our complete listing of colour combinations
var trialBlock = [
    { word: 'BLUE', colourCode: ColourCodes.BLUE, colourName: 'BLUE', congruency: Congruency.Congruent},
    { word: 'BLUE', colourCode: ColourCodes.GREEN, colourName: 'GREEN', congruency: Congruency.Incongruent},
    { word: 'BLUE', colourCode: ColourCodes.PINK, colourName: 'PINK', congruency: Congruency.Incongruent},
    { word: 'BLUE', colourCode: ColourCodes.RED, colourName: 'RED', congruency: Congruency.Incongruent},
    { word: 'GREEN', colourCode: ColourCodes.BLUE, colourName: 'BLUE', congruency: Congruency.Incongruent},
    { word: 'GREEN', colourCode: ColourCodes.GREEN, colourName: 'GREEN', congruency: Congruency.Congruent},
    { word: 'GREEN', colourCode: ColourCodes.PINK, colourName: 'PINK', congruency: Congruency.Incongruent},
    { word: 'GREEN', colourCode: ColourCodes.RED, colourName: 'RED', congruency: Congruency.Incongruent},
    { word: 'PINK', colourCode: ColourCodes.BLUE, colourName: 'BLUE', congruency: Congruency.Incongruent},
    { word: 'PINK', colourCode: ColourCodes.GREEN, colourName: 'GREEN', congruency: Congruency.Incongruent},
    { word: 'PINK', colourCode: ColourCodes.PINK, colourName: 'PINK', congruency: Congruency.Congruent},
    { word: 'PINK', colourCode: ColourCodes.RED, colourName: 'RED', congruency: Congruency.Incongruent},
    { word: 'RED', colourCode: ColourCodes.BLUE, colourName: 'BLUE', congruency: Congruency.Incongruent},
    { word: 'RED', colourCode: ColourCodes.GREEN, colourName: 'GREEN', congruency: Congruency.Incongruent},
    { word: 'RED', colourCode: ColourCodes.PINK, colourName: 'PINK', congruency: Congruency.Incongruent},
    { word: 'RED', colourCode: ColourCodes.RED, colourName: 'RED', congruency: Congruency.Congruent},
    { word: 'BLUE', colourCode: ColourCodes.BLUE, colourName: 'BLUE', congruency: Congruency.Congruent},
    { word: 'GREEN', colourCode: ColourCodes.GREEN, colourName: 'GREEN', congruency: Congruency.Congruent},
    { word: 'PINK', colourCode: ColourCodes.PINK, colourName: 'PINK', congruency: Congruency.Congruent},
    { word: 'RED', colourCode: ColourCodes.RED, colourName: 'RED', congruency: Congruency.Congruent},
    { word: 'BLUE', colourCode: ColourCodes.BLUE, colourName: 'BLUE', congruency: Congruency.Congruent},
    { word: 'GREEN', colourCode: ColourCodes.GREEN, colourName: 'GREEN', congruency: Congruency.Congruent},
    { word: 'PINK', colourCode: ColourCodes.PINK, colourName: 'PINK', congruency: Congruency.Congruent},
    { word: 'RED', colourCode: ColourCodes.RED, colourName: 'RED', congruency: Congruency.Congruent}
    ]

gorilla.ready(()=> {
    
    // Get the manipulations we set
    var noOfTrials = gorilla.manipulation(ManipulationsKeys.BlockSize, 24);
    var noOfBlocks = gorilla.manipulation(ManipulationsKeys.NoOfBlocks, 1);
    var colourOrWordFirst = gorilla.manipulation(ManipulationsKeys.ColourOrWordFirst, 'READING');
    var Feedback = (gorilla.manipulation(ManipulationsKeys.Feedback, 'yes') == 'yes') ? true : false;
    
    // Check for any stored data and populate it
    // The store needs to provide all the data necessary to restart the task in the event that the user refreshes the page
    // (accidently or on-purpose), so that they can continue where they were
    var currentTrial = gorilla.retrieve(GorillaStoreKeys.CurrentTrial, 0);
    var currentBlock = gorilla.retrieve(GorillaStoreKeys.CurrentBlock, 0);
    var currentReadOrSee = gorilla.retrieve(GorillaStoreKeys.CurrentReadOrSee, colourOrWordFirst);
    var currentStage = gorilla.retrieve(GorillaStoreKeys.CurrentStage, 'one');
    var finishedFlag = gorilla.retrieve(GorillaStoreKeys.FinishedFlag, false);
    
    var colours = ['BLUE', 'GREEN', 'PINK', 'RED']
    
    var trialArray = [];
    
    // function to shuffle all our trials
    function createShuffledTrials(cb: any){
        // reset our trial array
        trialArray = [];
        var indices = [];
        for(var i=0; i<trialBlock.length; i++){
            indices.push(i);
        }
        
        // gorilla.shuffle randomnly shuffles the contents of an array
        // we can now use these shuffled indices to randomise our trial array
        indices = gorilla.shuffle(indices);
        
        for(var i=0; i<trialBlock.length; i++){
            trialArray.push(trialBlock[indices[i]]);
        }
        
        cb();
    }
    
    // add in our responsive resizing to the frame
    gorilla.responsiveFrame('#gorilla');
    
    // create our state machine
    var SM = new stateMachine.StateMachine();
    
    // add our states to the state machine
    SM.addState(State.Instructions, {
        onEnter: (machine: stateMachine.Machine) => {
            
            // depending on whether we want them to pick words or colours first, the instructions will be in a different order
            var option1 = 'semantic meaning of the word. Ignore the pigment the text is displayed in';
            var option2 = 'pigment the text is displayed in. Ignore the semantic meaning of the word';
            
            var instructionsData = {firstTask: ''};
            
            if(colourOrWordFirst == 'READING'){
                instructionsData.firstTask = option1;
                
            } else {
                instructionsData.firstTask = option2;
                
            }
            
            gorilla.populate('#gorilla', 'instructions', instructionsData );
            gorilla.refreshLayout();
            $('#start-button').one('click', (event: JQueryEventObject) => {
                machine.transition(State.Trial);
            });
        }
    })
    
    SM.addState(State.Trial, {
        onEnter: (machine: stateMachine.Machine) => {
            // if this is the first trial, we need to create our list of trials
            // otherwise, proceed straight to trial logic
            if (currentTrial == 0){
                createShuffledTrials(()=> {
                    trialLogic();
                });
            } else {
                trialLogic();
            }
            
            // the main trial logic
            function trialLogic() {
                var trial = { wordData: trialArray[currentTrial], colours: colours, trialText: ''};
                
                if(colourOrWordFirst == 'READING') {
                    if(currentStage == 'one') {
                        trial.trialText = 'semantic meaning of the word'; 
                    } else {
                        trial.trialText = 'pigment the text is displayed in';
                    }
                } else {
                    if(currentStage == 'one') {
                        trial.trialText = 'pigment the text is displayed in'; 
                    } else {
                        trial.trialText = 'semantic meaning of the word';
                    }
                }
                
                gorilla.populate('#gorilla', 'trial', trial);
                gorilla.refreshLayout();
                $('.c-answer-button').attr('disabled', true);
                $('#gorilla')
                    .delay(200)
                    .queue(function () {
                        $('.gorilla-fixation-cross').show();
                        gorilla.refreshLayout();
                        $(this).dequeue();
                    })
                    .delay(500)
                    .queue(function () {
                        $('.gorilla-fixation-cross').hide();
                        $(this).dequeue();
                })
                    .delay(200)
                    .queue(function (){
                        $('.stimuli').show();
                        gorilla.refreshLayout();
                        $('.c-answer-button').attr('disabled', false);
                        gorilla.startStopwatch();
                        $(this).dequeue();
                    })
                
                
                $('.c-answer-button').one('click', (event) => {
                    
                    // unbind the other answer buttons
                    $('.c-answer-button').off('click');
                    gorilla.stopStopwatch();
                    var rt = gorilla.getStopwatch();
                    
                    currentTrial++;
                    gorilla.store(GorillaStoreKeys.CurrentTrial, currentTrial);
                    
                    var answer = $(event.currentTarget).data('answer');
                    
                    var correct = false;
                    if (currentReadOrSee == 'READING') {
                        correct = (answer == trial.wordData.word) ? true : false;
                    } else if (currentReadOrSee == 'SEEING') {
                        correct = (answer == trial.wordData.colourName) ? true : false;
                    }
                    
                    if(Feedback) {
                        if(correct){
                            $('.feedback-correct').show();
                        } else {
                            $('.feedback-incorrect').show();
                        }
                    }
                    
                    gorilla.refreshLayout();
                    
                    // upload our metrics
                    gorilla.metric({
                        targetText: trial.wordData.word,
                        targetColour: trial.wordData.colourName,
                        givenAnswer: answer,
                        correct: correct,
                        congruency: trial.wordData.congruency,
                        reactionTime: rt,
                        section: currentReadOrSee,
                        blockNo: currentBlock + 1,
                    });
                    
                    // this function will determine what happens next
                    // if we've run all the trials, we advance the number of blocks
                    // next, we decide whether we want to do another block of the same or switch to the other trial type (semantic or pigment)
                    function transition() {
                        if(currentTrial>=noOfTrials){
                            currentBlock++;
                            gorilla.store(GorillaStoreKeys.CurrentBlock, currentBlock);
                            // if we have exceeded our block number we need to decide whether to switch to the other task mode or finish
                            if(currentBlock>=noOfBlocks){
                                if(currentStage == 'one') {
                                    machine.transition(State.Intermission);
                                } else {
                                    finishedFlag = true;
                                    gorilla.store(GorillaStoreKeys.FinishedFlag, finishedFlag);
                                    machine.transition(State.Finish);
                                }
                            } else {
                                // if we're starting a new block in the current mode we need to reset the currentTrial and go back through the trial loop
                                currentTrial = 0;
                                gorilla.store(GorillaStoreKeys.CurrentTrial, currentTrial);
                                machine.transition(State.Trial);
                            }
                        } else {
                            machine.transition(State.Trial);
                        }
                    }
                    
                    // if we have feedback set, display that before we begin the transition logic
                    if(Feedback){
                        $('#gorilla')
                        .delay(500)
                        .queue(function () {
                        transition();
                        $(this).dequeue();
                        })
                    } else {
                        transition();
                    }
                });
            }
        }
    })
    
    // instructions for the intermission state
    SM.addState(State.Intermission, {
        onEnter: (machine: stateMachine.Machine) => {
            var instructions = '';
            if(colourOrWordFirst == 'READING'){
                instructions = 'pigment the text is displayed in. Ignore the semantic meaning of the word';
                currentReadOrSee = 'SEEING';
                gorilla.store(GorillaStoreKeys.CurrentReadOrSee, currentReadOrSee);
            } else {
                instructions = 'semantic meaning of the word. Ignore the pigment the text is displayed in';
                currentReadOrSee = 'READING';
                gorilla.store(GorillaStoreKeys.CurrentReadOrSee, currentReadOrSee);
            }
            
            gorilla.populate('#gorilla', 'intermission', { instructions: instructions});
            gorilla.refreshLayout();
            $('#continue-button').one('click', (event: JQueryEventObject) => {
                // we now need to reset all of our stores, ready for the next stage of the trial
                currentStage = 'two';
                currentTrial = 0;
                currentBlock = 0;
                gorilla.store(GorillaStoreKeys.CurrentStage, currentStage);
                gorilla.store(GorillaStoreKeys.CurrentTrial, currentTrial);
                gorilla.store(GorillaStoreKeys.CurrentBlock, currentBlock);
                machine.transition(State.Trial);
            });
        }
    })
   
   SM.addState(State.Finish, {
       onEnter: (machine: stateMachine.Machine) => {
           gorilla.populate('#gorilla', 'finish', {});
           gorilla.refreshLayout();
           $('#finish-button').one('click', (event: JQueryEventObject) => {
                gorilla.finish();
            });
           
       }
   })
   
   gorilla.run(function() {
       SM.start(State.Instructions);
   });
})
