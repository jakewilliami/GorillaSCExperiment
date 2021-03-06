/*--------------------------------------*/
// This file contains utilities used in
// the main.ts experiment file, which
// don't need to be in the main file.
/*--------------------------------------*/

// define proportion of distractors (i.e., 50% of trials)
// are distractor arrays, so prop. is 0.5
const proportionOfDistractors: number = 1 / 3;
const proportionOfTargets: number = 1 - proportionOfDistractors;

// ibid. with practice trials
const proportionOfPracticeDistractors: number = 0.5;
const proportionOfPracticeTargets: number = 1 - proportionOfPracticeDistractors;

// define where numbered distractors start and end
const dStart: number = 1;
const dEnd: number = 400;
// define where numbered targets (per block) start and end
const tStart: number = 1;
const tEnd: number = 25;
// define how many practice trials you have
const pStart: number = 1;
const pEnd: number = 6;

// define number of images in the grid
// i.e., out grid is 5x5 (25)
export const nImagesInGrid: number = 25;

// define distractor and target prefix
const distractorPrefix: string = 'D';
const carPrefix: string = 'C';
const facePrefix: string = 'F';
const highFacePrefix: string = 'HF';
const lowFacePrefix: string = 'LF';
const practicePrefix: string = 'Bird'; // P for Practice

// define file extension
const imageExt: string = 'png';

// define image conditions (defined by Lizzie)
const conditionCodes: Object = {
    'F': 1,
    'C': 2,
    'LF': 3,
    'HF': 4,
}

/*--------------------------------------*/
// There is not much that you should need
// to change below this line!
/*--------------------------------------*/

// set modulo value
export const moduloVal: number = Math.floor(1 / proportionOfDistractors);
const numberOfTrialImages: number = tEnd - tStart + 1;
const nTrialsPerBlock: number = Math.floor(numberOfTrialImages / proportionOfTargets);
export const practiceModuloVal: number = Math.floor(1 / proportionOfPracticeDistractors);
const numberOfPracticeImages: number = pEnd - pStart + 1;
const nPracticeTrials: number = Math.floor(numberOfPracticeImages / proportionOfPracticeTargets);

// Chooses a random integer between lower and upper inclusive
export function randInt(lower: number, upper: number) {
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

// Takes a random index from an array
function randIndex<T>(arr: T[]) {
    return randInt(0, (arr.length - 1));
}

// Choose a random element from an array
export function randVal<T>(arr: T[]) {
    const randomIndex: number = randIndex(arr);
    return arr[randomIndex];
}

// *Takes* a random element from an array.
// This is a mutating function
export function takeRand<T>(arr: T[]) {
    const randInd: number = randIndex(arr);
    const randVal: T = arr[randInd];
    arr.splice(randInd, 1);
    return randVal;
}

// Similar to above, but takes the first element from the array.
// This is a mutating function
export function takeFirst<T>(arr: T[]) {
    const firstVal: T = arr[0];
    arr.splice(0, 1);
    return firstVal;
}

// Chooses n-many unique random numbers between lower and upper inclusive
function chooseNUniqueRandomWithinRange(n: number, lower: number, upper: number) {
    var arr: number[] = [];
    while(arr.length < n) {
        const a = randInt(lower, upper);
        if (arr.indexOf(a) === -1) {
            arr.push(a);
        }
    }
    return arr;
}

// *Takes* n many random elements from an array
// This is a mutating funciton
export function takeNRand<T>(arr: T[], n: number) {
    var outArr: T[] = [];
    
    // loop through values of
    for (var i: number = 0; i < n; i++) {
        outArr.push(takeRand(arr));
    }
    
    return outArr;
}

// Chooses n unique random elements from an array
// This function does NOT mutate the input array
export function chooseNUniqueRand<T>(arr: T[], n: number) {
    var tempArr: T[] = [...arr];
    var outArr: T[] = [];
    
    // loop through values of
    for (var i: number = 0; i < n; i++) {
        outArr.push(takeRand(tempArr));
    }
    
    return outArr
}

export function chooseNRand<T>(arr: T[], n: number) {
    var outArr: T[] = [];
    
    for (var i: number = 0; i < n; i++) {
        outArr.push(randVal(arr));
    }
    
    return outArr;
}

// Fisher-Yates (aka Knuth) Shuffle; see https://www.wikiwand.com/en/Fisher%E2%80%93Yates_shuffle
// This shuffles the given array using the above mentioned algorithm
// This is a mutating function
export function shuffle<T>(array: T[]) {
    var currentIndex: number = array.length;
    var temporaryValue: T;
    var randomIndex: number;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

// Constructs an array of numbers, ordered, between lower and upper inclusive
function _constructNumberArray(lower: number, upper: number) {
    var arr: number[] = [];
    for (var i: number = lower; i <= upper; i++) {
        arr.push(i)
    }
    return arr;
}

export function constructNumberArray(lower: number, upper: number) {
    var arr: number[] = [];
    for (var i: number = lower; i <= upper; i++) {
        arr.push(i)
    }
    return arr;
}

export function constructShuffledNumberArray(lower: number, upper: number) {
    var outArr: number[] = constructNumberArray(lower, upper)
    shuffle(outArr);
    return outArr;
}

export function constructNameArray(arrayOfIndices: number[], prefix: string, suffix: string) {
    var arrayOfNames: string[] = [];
    for (var i: number = 0; i < arrayOfIndices.length; i++) {
        arrayOfNames.push(prefix + arrayOfIndices[i] + suffix);
    }
    return arrayOfNames;
}

// Constructs a numbered array of values from tStart to nTrialsPerBlock
// These numbers are taken from the array and used to determine whether
// to show a distractor or target image
export function constructBlockArray() {
    return _constructNumberArray(tStart, nTrialsPerBlock)
    // return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
}

// Constructs a numbered array of values from the first index of targets
// to the last index of targets.  For example, if you had 25 target images,
// then the array would be number from 0 to 24.
export function constructTargetArray() {
    return _constructNumberArray((tStart - 1), (tEnd - 1))
    // return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
}

// Constructs an array of indices of possible positions of the target image.
// For example, if you had a 5x5 target array, constructs an array from
// 0 to 24.
export function constructTargetPositions() {
    return _constructNumberArray(0, (nImagesInGrid - 1))
}

// Constructs an array of values frompStart to the number of practice trials.
// These numbers are taken from the array and used to determine whether to
// show a distractor or target for the practice trials.
export function constructPracticeArray() {
    return _constructNumberArray(pStart, nPracticeTrials)
    // return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
}

// Constructs a stimulus name given a prefix and image number.
// Uses imageExt defined globally (and privately) above.
export function constructStimName(prefix: string, imageNumber: number) {
    return prefix + imageNumber + '.' + imageExt;
}

// Constructs a random array of n distractor images by name
export function generateDistractorArray(n: number) {
    var distractorNumbers: number[] = chooseNUniqueRandomWithinRange(n, dStart, dEnd);
    var distractorImageNumbers: string[] = [];
    for (var i: number = 0; i < distractorNumbers.length; i++){
        distractorImageNumbers.push(constructStimName(distractorPrefix, distractorNumbers[i]));
    }

    return distractorImageNumbers;
}

// Generates a random array of practice images by name.  This
// uses all practice targets, as we don't take a selection of them.
// A similar method would be to construct the number array, turn
// them all into stimulus names, and then use the shuffle algorithm.
// Have not benchmarked which is faster though.
export function generatePracticeArray(prefix: string) {
    var practiceNumbers: number[] = chooseNUniqueRandomWithinRange((pEnd - pStart + 1), pStart, pEnd);
    var practiceImages: string[] = [];
    for (var i: number = 0; i < practiceNumbers.length; i++) {
        practiceImages.push(constructStimName(prefix, practiceNumbers[i]));
    }
    
    return practiceImages;
}

// Inserts an item at index in an array arr.
// This is a mutating function.
export function insert(arr: string[], index: number, item: string) {
    arr.splice(index, 0, item);
    return arr;
}

// Custom-defined condition codes for one fewer step in
// data processing
export function getCondCode(condition: string) {
    return conditionCodes[condition];
}

// Condition names for readable data processing
export function encodeTargetType(condition: string) {
    switch (condition) {
        case 'F':
            return 'face';
        case 'C':
            return 'car';
        case 'LF':
            return 'low';
        case 'HF':
            return 'high';
    }
    // should never get here
    return null;
}

// Human-readable target encoding for displaying in between-block
// instructions
export function encodeTargetTypeHR(condition: string) {
    switch (condition) {
        case 'F':
            return 'faces';
        case 'C':
            return 'cars';
        case 'LF':
        case 'HF':
            return 'objects that looks like faces';
    }
    // should never get here
    return 0;
}

// This function will test whether or not the participant is in
// fullscreen.  As almost every browser has its own variable for
// checking this, we need to test them all
export function isFullscreen(){
    return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
}

// This function will launch the participant into fullscreen.
// As above, we have to call a different function for every browser
export function launchIntoFullscreen(element){
    if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}
