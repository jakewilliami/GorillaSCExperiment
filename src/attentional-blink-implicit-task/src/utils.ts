/*--------------------------------------*/
// This file contains utilities used in
// the main.ts experiment file, which
// don't need to be in the main file.
/*--------------------------------------*/

import config = require('config');
import { ImageType, ImageUtilsConfigs } from './types';

const utilsConfigs: ImageUtilsConfigs = config.exprConfigs.imageUtilsConfigs;

/*--------------------------------------*/
// There is not much that you should need
// to change below this line!
/*--------------------------------------*/

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
    const arr: number[] = [];
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
    const outArr: T[] = [];
    
    // loop through values of
    for (let i = 0; i < n; i++) {
        outArr.push(takeRand(arr));
    }
    
    return outArr;
}

// Chooses n unique random elements from an array
// This function does NOT mutate the input array
export function chooseNUniqueRand<T>(arr: T[], n: number) {
    const tempArr: T[] = [...arr];
    const outArr: T[] = [];
    
    // loop through values of
    for (let i = 0; i < n; i++) {
        outArr.push(takeRand(tempArr));
    }
    
    return outArr
}

export function chooseNRand<T>(arr: T[], n: number) {
    const outArr: T[] = [];
    
    for (let i = 0; i < n; i++) {
        outArr.push(randVal(arr));
    }
    
    return outArr;
}

// Fisher-Yates (aka Knuth) Shuffle; see https://www.wikiwand.com/en/Fisher%E2%80%93Yates_shuffle
// This shuffles the given array using the above mentioned algorithm
// This is a mutating function
export function shuffle<T>(array: T[]) {
    let currentIndex: number = array.length;
    let temporaryValue: T;
    let randomIndex: number;

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
    const arr: number[] = [];
    for (let i: number = lower; i <= upper; i++) {
        arr.push(i)
    }
    return arr;
}

export function constructNumberArray(lower: number, upper: number) {
    const arr: number[] = [];
    for (let i: number = lower; i <= upper; i++) {
        arr.push(i)
    }
    return arr;
}

export function constructShuffledNumberArray(lower: number, upper: number) {
    const outArr: number[] = constructNumberArray(lower, upper)
    shuffle(outArr);
    return outArr;
}

export function constructNameArray(arrayOfIndices: number[], prefix: string, suffix: string) {
    const arrayOfNames: string[] = [];
    for (let i = 0; i < arrayOfIndices.length; i++) {
        arrayOfNames.push(prefix + arrayOfIndices[i] + suffix);
    }
    return arrayOfNames;
}

// Constructs a numbered array of values from tStart to nTrialsPerBlock
// These numbers are taken from the array and used to determine whether
// to show a distractor or target image
export function constructBlockArray() {
    return _constructNumberArray(utilsConfigs.targetRange.start, utilsConfigs.nTrialsPerBlock)
    // return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
}

// Constructs a numbered array of values from the first index of targets
// to the last index of targets.  For example, if you had 25 target images,
// then the array would be number from 0 to 24.
export function constructTargetArray() {
    return _constructNumberArray((utilsConfigs.targetRange.start - 1), (utilsConfigs.targetRange.end - 1))
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
    return _constructNumberArray(utilsConfigs.practiceRange.start, utilsConfigs.nPracticeTrials)
    // return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
}

// Constructs a stimulus name given a prefix and image number.
// Uses imageExt defined globally (and privately) above.
export function constructStimName(prefix: string, imageNumber: number) {
    return prefix + imageNumber + '.' + utilsConfigs.imgExt;
}

// Constructs a random array of n distractor images by name
export function generateDistractorArray(n: number) {
    const distractorNumbers: number[] = chooseNUniqueRandomWithinRange(n, utilsConfigs.distractorRange.start, utilsConfigs.distractorRange.end);
    const distractorImageNumbers: string[] = [];
    for (let i = 0; i < distractorNumbers.length; i++){
        distractorImageNumbers.push(constructStimName(utilsConfigs.imagePrefixes[ImageType.Distractor], distractorNumbers[i]));
    }

    return distractorImageNumbers;
}

// Generates a random array of practice images by name.  This
// uses all practice targets, as we don't take a selection of them.
// A similar method would be to construct the number array, turn
// them all into stimulus names, and then use the shuffle algorithm.
// Have not benchmarked which is faster though.
export function generatePracticeArray(prefix: string) {
    const pStart: number = utilsConfigs.practiceRange.start;
    const pEnd: number = utilsConfigs.practiceRange.end;
    const practiceNumbers: number[] = chooseNUniqueRandomWithinRange((pEnd - pStart + 1), pStart, pEnd);
    const practiceImages: string[] = [];
    for (let i = 0; i < practiceNumbers.length; i++) {
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
