/*--------------------------------------*/
// This is the main programme file that
// runs when the programme is started.
/*--------------------------------------*/

// API imports
import gorilla = require('gorilla/gorilla');
import stateMachine = require('gorilla/state_machine');
// our imports
import utils = require('utils');
import trial = require('trial');
import config = require('config');
import {
    BlockStruct,
    GlobalExperimentState,
    ImageType,
    ImageStruct,
    ResponseKeyCode,
    State,
    TargetCondition,
    TrialStruct,
} from 'types';
import { getImageURLs } from './trial';

/*--------------------------------------*/
// Define a global experiment struct that will
// help us to keep track of important experiment
// information throught all blocks/trials
/*--------------------------------------*/

const exprState = new GlobalExperimentState(config.exprConfigs);

if ((exprState.nT2ImagesPerBlock % exprState.lagPositions.length) !== 0) {
    console.warn('The number of T2 images does not divide equally into the number of lag positions you have specified.')
}

/*--------------------------------------*/
// There is not much that you should need
// to change below this line!
/*--------------------------------------*/

// global boolean variable which we update in order to check
// if we are allowed to press the response key or not
let keypressAllowed = false;

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
    const imageInfoArr: ImageStruct[] = [];
    for (let i = 0; i < stimArr.length; i++) {
        const imageInfo: ImageStruct = getImageStruct(stimArr[i], imgType);
        imageInfoArr.push(imageInfo);
    }

    return imageInfoArr;
}

// need demographics to be global
let participantID: string;
let participantGender: string;
let participantAge: number;

// initialise image arrays as global
let allDistractorImages: ImageStruct[];
let allFaceImages: ImageStruct[];
let allObjectImages: ImageStruct[];
let allPareidoliaImages: ImageStruct[];
let allWatchImages: ImageStruct[];
let allPracticeTargetImages: ImageStruct[];  // TODO: this might need to be turned back to URLs in the interest of preloading

// Initialise global target array
const allExampleTargets = {};  // I would use type Record<string, string> if I could, but Gorilla complains

// all practice images
let practiceFaceImages: ImageStruct[];
let practiceWatchImages: ImageStruct[];
let practicePareidoliaImages: ImageStruct[];
let practiceT1Images: ImageStruct[];
let practiceT2Images: ImageStruct[];

// this is the main gorilla function call!
gorilla.ready(function(){
    // initialise stopwatch
  gorilla.initialiseTimer();

    // initialise state machine
    const SM = new stateMachine.StateMachine();

  // initialise a block counter
  let blockCounter = 0;

  SM.addState(State.PreloadArrays, {
    onEnter: (machine: stateMachine.Machine) => {
      gorilla.populateAndLoad('#gorilla', 'loading', {
            loadingMessage: exprState.imageLoadingMessage,
      }, () => {
            //// INITIALISE URL LISTS BEFORE TASK BEGINS
            // set number array for main target variables
            // TODO: make these numbers dynamic/come from a dictionary of (ImageType => nImages)
            const allFacesAsNumbers: number[] = utils.constructNumberArray(1, exprState.nT1ImagesPerBlock);  // Set the no. of T1 images per block in config.ts
            const allPareidoliaAsNumbers: number[] = utils.constructNumberArray(1, exprState.nT1ImagesPerBlock);
            const allWatchesAsNumbers: number[] = utils.constructNumberArray(1, exprState.nT1ImagesPerBlock);
            const allObjectsAsNumbers: number[] = utils.constructNumberArray(1, exprState.nT2ImagesPerBlock); // T2 is always a flower
            // construct array of T2 images
            // TODO: it would be nice to allow constructNameArray to take an ImageType that will construct the image names with preconfigured image name suffixes
            const allFaceNames: string[] = utils.constructNameArray(allFacesAsNumbers, 'Face', '.' + exprState.imageUtilsConfigs.imgExt); // Have named images appropriately 
            const allPareidoliaNames: string[] = utils.constructNameArray(allPareidoliaAsNumbers, 'Pareidolia', '.' + exprState.imageUtilsConfigs.imgExt);
            const allWatchNames: string[] = utils.constructNameArray(allWatchesAsNumbers, 'Watch', '.' + exprState.imageUtilsConfigs.imgExt);
            const allObjectNames: string[] = utils.constructNameArray(allObjectsAsNumbers, 'Flower', '.' + exprState.imageUtilsConfigs.imgExt);
            // convert to URLs
            allFaceImages = constructImageArray(allFaceNames, ImageType.Face);
            allObjectImages = constructImageArray(allObjectNames, ImageType.Flower); // This experiment uses flower objects
            allPareidoliaImages = constructImageArray(allPareidoliaNames, ImageType.Pareidolia);
            allWatchImages = constructImageArray(allWatchNames, ImageType.Watch);
            // Add all T1/T2 image information
            // In the present experiment, T2 is always flower, and T1 can be either a watch, face, or pareidolia face
            exprState.t1Images = [
                ...allFaceImages,
                ...allPareidoliaImages,
                ...allWatchImages,
            ];
            exprState.t2Images = [...allObjectImages]

            // set URL array of all distractors
            const allDistractorNumbers: number[] = utils.constructNumberArray(1, exprState.nDistractors);
            const allDistractorNames: string[] = utils.constructNameArray(allDistractorNumbers, 'D', '.' + exprState.imageUtilsConfigs.imgExt) 
            allDistractorImages = constructImageArray(allDistractorNames, ImageType.Distractor);

            // get practice targets
            const practiceImageNumbersPerT1Type: number[] = utils.constructNumberArray(1, exprState.nPracticeT1ImagesPerT1Type);
            const practiceFaceNames: string[] = utils.constructNameArray(practiceImageNumbersPerT1Type, 'Pface', '.' + exprState.imageUtilsConfigs.imgExt); // TODO:Get unique images for practice images
            const practiceWatchNames: string[] = utils.constructNameArray(practiceImageNumbersPerT1Type, 'Pwatch', '.' + exprState.imageUtilsConfigs.imgExt);
            const practicePareidoliaNames: string[] = utils.constructNameArray(practiceImageNumbersPerT1Type, 'Ppareidolia', '.' + exprState.imageUtilsConfigs.imgExt);
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
                ...practiceT2Images,
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
              ...allDistractorImages,
              ...exprState.t1Images,
              ...exprState.t2Images,
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
                machine.transition(State.Consent);
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
                const rawAge = (<HTMLInputElement>document.getElementById("age")).value;

                if (participantID == "" || rawAge == "" || participantGender === "undef") {
                    $('.invalid-age').hide();
                    $('.incomplete-message').show();
                } else {
                    const intAge = parseInt(rawAge);
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
            const blockStruct = {
                trialCounter: 0,
                t1TargetsArray: practiceT1Images,
                t2DisplayPotentialArray: utils.constructNumberArray(1, exprState.nPracticeT1Images), // whether or not T2 is displayed,
                t2DisplayGapOptions: utils.constructNumberArray(1, exprState.nPracticeT2Images),
                t2TargetsArray: practiceT2Images,
                trialArrayURLs: [],
                t2PosGap: 0,
                t2Condition: TargetCondition.None,
                thisTrialStruct: {} as TrialStruct,
                t1Image: {} as ImageStruct,
                t2Image: {} as ImageStruct,
            } as BlockStruct

            // $('#start-button').one('click', (event: JQueryEventObject) => {
            machine.transition(State.PracticeBlock, blockStruct);
            // }) // end on keypress
        }, // end onEnter State.BlockInitialiser
    }) // end addState State.BlockInitialiser

    SM.addState(State.PracticeBlock, {
        // this state determines whether or not to go to the next block, do another trial, or finish
        onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
            machine.transition(...trial.nextPracticeState(blockStruct));  // TODO: this shouldn't be failing but it is
        }, // end onEnter State.Block
    }) // end addState State.Block

    SM.addState(State.PracticePreTrial, {
        onEnter: (machine: stateMachine.Machine, blockStruct: BlockStruct) => {
          console.log("======================================================");

            // increment trail counter (needed for breaks)
            blockStruct.trialCounter++;

            // initialise distractor array
            let practiceTrialImageArray: ImageStruct[];

            const t1Image: ImageStruct = utils.takeRand(blockStruct.t1TargetsArray);
            console.log("T1 image has been chosen: " + t1Image.name);
            console.log("T1 image possibilities left are " + blockStruct.t1TargetsArray);

            // choose whether or not T2 is displayed
            const t2DeterministicNumber: number = utils.takeRand(blockStruct.t2DisplayPotentialArray)
            if (t2DeterministicNumber % 2 == 0) {
                // do not display T2
                console.log("T2 image is not being displayed");
                blockStruct.t2Condition = TargetCondition.Absent;
                // construct random distractor array
                practiceTrialImageArray = utils.chooseNUniqueRand(allDistractorImages, exprState.nImagesInSequence - 1);
                const randomInsertIndex: number = utils.randInt(0, exprState.nImagesInSequence - 1);
                // insert T1 into trial array
                utils.insert(practiceTrialImageArray, randomInsertIndex, t1Image);  // TODO: this should not be erroring
            } else {
                // display T2; more complex choices to make (what T2 is)
                blockStruct.t2Condition = TargetCondition.Present;
                const t2Image: ImageStruct = utils.takeRand(blockStruct.t2TargetsArray);
                console.log("We are going to display T2");
                console.log("T2 image has been chosen: " + t2Image.name);
                console.log("T2 image possibilities left are " + blockStruct.t2TargetsArray);
                // construct random distractor array
                practiceTrialImageArray = utils.chooseNUniqueRand(allDistractorImages, exprState.nImagesInSequence - 2);

                // choose T2 image gap
                const t2ImageTypeNumber: number = utils.takeRand(blockStruct.t2DisplayGapOptions);
                const t2ImageTypeNumberModulo: number = t2ImageTypeNumber % exprState.lagPositions.length;
                console.log('Image lag type is' + t2ImageTypeNumberModulo);

                blockStruct.t2PosGap = exprState.lagPositions[t2ImageTypeNumberModulo];
                console.log('So image gap is' + blockStruct.t2PosGap);

                const trialArrayT1MaxPos: number = exprState.nImagesInSequence - blockStruct.t2PosGap;
                const randomInsertIndex: number = utils.randInt(0, trialArrayT1MaxPos - 1);
                // insert T1 into trial array
                utils.insert(practiceTrialImageArray, randomInsertIndex, t1Image);  // TODO: this should not be erroring
                // insert T2 into trial array
                utils.insert(practiceTrialImageArray, randomInsertIndex + blockStruct.t2PosGap, t2Image);  // TODO: this should not be erroring
            }

            console.log("T2 display potential left are: " + blockStruct.t2DisplayPotentialArray);

            // update blockStruct to have correct trial array
            blockStruct.trialArrayURLs = getImageURLs(practiceTrialImageArray);

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
                    .delay(exprState.imageDisplayLength)
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
                        .delay(exprState.beforeFixationDelay)
                        .queue(function (next) {
                            $('.fixation-cross').show();
                            gorilla.refreshLayout();
                            // $(this).dequeue();
                            next();
                        })// end queue for '#gorilla'
                        .delay(exprState.fixationLength)
                        .queue(function (next) {
                            $('.fixation-cross').hide();
                            gorilla.refreshLayout();
                            // $(this).dequeue();
                            next();
                        }) // end queue for '#gorilla'
                        .delay(exprState.afterFixationDelay)
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
                    targetPresent: String.fromCharCode(ResponseKeyCode.Present),
                    targetAbsent: String.fromCharCode(ResponseKeyCode.Absent),
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
                                .delay(exprState.practiceFeedbackMessageLength)
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
                                .delay(exprState.practiceFeedbackMessageLength)
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
        // for example, it is useful to put things in here that you might need, which
        // don't need to persist outside of the block
        onEnter: (machine: stateMachine.Machine) => {
            // increment block counter
            blockCounter++;

            // construct T1 array
            const t1TargetsArray: ImageStruct[] = utils.takeNRand(exprState.t1Images, exprState.nT1ImagesPerBlock);

            // construct T2 array of n random flowers
            // Note: this may result in repeating T2 images between blocks
            const t2TargetsArray: ImageStruct[] = utils.chooseNUniqueRand(allObjectImages, exprState.nT2ImagesPerBlock);  // TODO: initialise flower URLs

            const t2DisplayPotentialArray: number[] = utils.constructNumberArray(1, exprState.nT1ImagesPerBlock); // whether or not T2 is displayed
            const t2DisplayGapOptions: number[] = utils.constructNumberArray(1, exprState.nT2ImagesPerBlock);

            const blockStruct = {
                trialCounter: 0,
                t1TargetsArray: t1TargetsArray,
                t2DisplayPotentialArray: t2DisplayPotentialArray,
                t2DisplayGapOptions: t2DisplayGapOptions,
                t2TargetsArray: t2TargetsArray,
                trialArrayURLs: [],
                t2PosGap: 0,
                t2Condition: TargetCondition.None,
                thisTrialStruct: {} as TrialStruct,
                t1Image: {} as ImageStruct,
                t2Image: {} as ImageStruct,
            } as BlockStruct

            // display block instructions
            gorilla.populateAndLoad($('#gorilla'), 'block-instructions', {
                blockCounter: blockCounter,
                nBlocks: exprState.nBlocks,
                trialType: imageTypeHR,  // TODO: these will need to be changed as well (when changing the ෴ files)
                exampleTargets: allExampleTargets[blockType], // TODO: same here (probably needs deleting)
                imSize: exprState.exampleImageSize,
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
            machine.transition(...trial.nextState(blockStruct, exprState)); // TODO: this should also not error
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
            let trialImageArray: ImageStruct[] = [];

            blockStruct.t1Image = utils.takeRand(blockStruct.t1TargetsArray); // TODO: change t1TargetURLsArray to a list of objects as follows: ['https://...', ...] -> [{'https://...', 'Pface1.jpg', 'face'}]
                        
            console.log("T1 image has been chosen: " + blockStruct.t1Image.name);
            console.log("T1 image possibilities left are " + blockStruct.t1TargetsArray);

            // choose whether or not T2 is displayed
            const t2DeterministicNumber: number = utils.takeRand(blockStruct.t2DisplayPotentialArray)
            if (t2DeterministicNumber % 2 == 0) {
                // do not display T2
                console.log("T2 image is not being displayed");
                blockStruct.t2Condition = TargetCondition.Absent;
                // construct random distractor array
                trialImageArray = utils.chooseNUniqueRand(allDistractorImages, exprState.nImagesInSequence - 1);
                const randomInsertIndex: number = utils.randInt(0, exprState.nImagesInSequence - 1);
                // insert T1 into trial array
                utils.insert(trialImageArray, randomInsertIndex, blockStruct.t1Image); // TODO: this should not error
                // be sure to redefine the position gap for metric recording
                blockStruct.t2PosGap = 0;
                blockStruct.t2Image = {
                    name: '',
                    url: '',
                    type: ImageType.None,
                } as ImageStruct;
            } else {
                // display T2; more complex choices to make (what T2 is)
                blockStruct.t2Condition = TargetCondition.Present;
                blockStruct.t2Image = utils.takeRand(blockStruct.t2TargetsArray)
                console.log("We are going to display T2");
                console.log("T2 image has been chosen: " + blockStruct.t1Image.name);
                console.log("T2 image possibilities left are " + blockStruct.t2TargetsArray);
                // construct random distractor array
                trialImageArray = utils.chooseNUniqueRand(allDistractorImages, exprState.nImagesInSequence - 2);

                // choose T2 image gap
                const t2ImageTypeNumber: number = utils.takeRand(blockStruct.t2DisplayGapOptions);
                console.log('Image number type is' + (t2ImageTypeNumber % 3));
                const t2ImageTypeNumberModulo: number = t2ImageTypeNumber % exprState.lagPositions.length;

                blockStruct.t2PosGap = exprState.lagPositions[t2ImageTypeNumberModulo];
                console.log('So image gap is' + blockStruct.t2PosGap);

                const trialArrayT1MaxPos: number = exprState.nImagesInSequence - blockStruct.t2PosGap;
                const randomInsertIndex: number = utils.randInt(0, trialArrayT1MaxPos - 1);
                // insert T1 into trial array
                utils.insert(trialImageArray, randomInsertIndex, blockStruct.t1Image); // TODO: Why is Gorilla telling me "no"?
                // insert T2 into trial array
                utils.insert(trialImageArray, randomInsertIndex + blockStruct.t2PosGap, blockStruct.t2Image); // TODO: Why is Gorilla telling me "no"?
            }

            console.log("T2 display potential left are: " + blockStruct.t2DisplayPotentialArray);

            // update blockStruct to have correct trial array
            blockStruct.trialArrayURLs = trial.getImageURLs(trialImageArray);

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
                .delay(exprState.imageDisplayLength)
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
                    .delay(exprState.beforeFixationDelay)
                    .queue(function (next) {
                        $('.fixation-cross').show();
                        gorilla.refreshLayout();
                        // $(this).dequeue();
                        next();
                    })// end queue for '#gorilla'
                    .delay(exprState.fixationLength)
                    .queue(function (next) {
                        $('.fixation-cross').hide();
                        gorilla.refreshLayout();
                        // $(this).dequeue();
                        next();
                    }) // end queue for '#gorilla'
                    .delay(exprState.afterFixationDelay)
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
                    targetPresent: String.fromCharCode(ResponseKeyCode.Present),
                    targetAbsent: String.fromCharCode(ResponseKeyCode.Absent),
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

                            // Actually *store* the data!
                            // IMPORTANT: these keys had to be imported into the `Metircs` tab!
                            gorilla.metric({
                                t1_condition: blockStruct.t1Image.type,  // TODO: get this working with string enums
                                t2_category: blockStruct.t2Image.type, // TODO: this too
                                t2_condition: blockStruct.t2Condition,
                                t2_position_gap: blockStruct.t2PosGap,
                                t2_response_correct: trial.responseIsCorrect(blockStruct, e),
                                t2_response_key: String.fromCharCode(e),
                                t2_response_time:  responseTime,
                                age: participantAge,
                                id: participantID,
                                gender: participantGender,
                                t1_image: blockStruct.t1Image.name,
                                t2_image: blockStruct.t2Image.name,
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
                debriefform: gorilla.resourceURL(exprState.debriefFilename)
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
