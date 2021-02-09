// define proportion of distractors (i.e., 50% of trials)
// are distractor arrays, so prop. is 0.5
const proportionOfDistractors: number = 0.5;
const proportionOfTargets: number = 1 - proportionOfDistractors;

// define where numbered distractors start and end
const Dstart: number = 1;
const Dend: number = 49;
// define where numbered targets start and end
const Tstart: number = 1;
const Tend: number = 25;
// define how many practice trials you have
const Pstart: number = 1;
const Pend: number = 6;

// define distractor and target prefix
const distractorPrefix: string = 'D';
const carPrefix: string = 'C';
const facePrefix: string = 'F';
const highFacePrefix: string = 'HF';
const lowFacePrefix: string = 'LF';
const practicePrefix: string = 'P'; // P for Practice

// define file extension
const imageExt: string = 'jpg';

/*
This utils.ts file exports the following helper functions:
  - randInt(lower, upper)
    - Generates a random integer (whole, natural number) between lower and upper numbers
  - randVal(arr)
      - Pulls a random value from the given array
  - takeRand(arr)
      - Extracts a random element from an array.  *This is a modifying function*.  It will return the element it extracts, like pop.
  - chooseNUniqueRandomWithinRange(n, lower, upper)
      - Chooses n many unique random numbers between lower and upper bounds
  - constructBlockArray()
      - Constructs an array of values 1:50.
  - constructTargetArray()
      - Constructs an array of values 0:24.
  - constructPracticeArray()
      - Constructs an array of values 1:6.
  - constructImageName(imageType, imageNumber)
      - constructs the image file name given the imageType and the imageNumber.  ImageType can be one of ['D', 'F', 'C', 'HF', 'LF'].
  - constructRandImageName(imageType)
      - constructs the image name of a random number within the given image type.  ImageType can be one of ['D', 'F', 'C', 'HF', 'LF'].
  - generateDistractorArray(n)
      - Generates an array of n many distractor names
  - insert(array, index, item)
      - Inserts item into array at specified index, then returns the array.
  - insertAtRandom(array, item)
      - Inserts item into array at random, then returns the array.
  - encodeTargetType(condition)
      - Takes in one of ['D', 'F', 'C', 'HF', 'LF'] and codes them into strings, as defined by Lizzie.
  - getCondCode(condition)
      - Takes in one of  ['D', 'F', 'C', 'HF', 'LF'] and codes them into numbers, as defined by Lizzie.
  - encodeTargetTypeHR(condition)
      - Takes in one of ['D', 'F', 'C', 'HF', 'LF'] and codes them into human-readable strings, as defined by Lizzie.
*/

/*--------------------------------------*/

// set modulo value
export const moduloVal: number = Math.floor(1 / proportionOfTargets);
const numberOfTrialImages: number = Tend - Tstart + 1;
export const nTrialsPerBlock: number = Math.floor(numberOfTrialImages / proportionOfTargets);
const numberOfPracticeImages: number = Pend - Tstart + 1;
const nPracticeTrials: number = Math.floor(numberOfPracticeImages / proportionOfTargets);

export function randInt(lower: number, upper: number) {
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

export function randVal(arr: any[]) {
    const randomIndex: number = randInt(0, (arr.length - 1));
    return arr[randomIndex];
}

export function takeRand(arr: any[]) {
    const randInd: number = randInt(0, (arr.length - 1));
    const randVal = arr[randInd];
    arr.splice(randInd, 1);
    return randVal;
}

export function chooseNUniqueRandomWithinRange(n: number, lower: number, upper: number) {
    var arr: number[] = [];
    while(arr.length < n) {
        const a = randInt(lower, upper);
        if (arr.indexOf(a) === -1) {
            arr.push(a);
        }
    }
    return arr;
}

// Fisher-Yates (aka Knuth) Shuffle; see https://www.wikiwand.com/en/Fisher%E2%80%93Yates_shuffle
export function shuffle(array: any[]) {
    var currentIndex: number = array.length;
    var temporaryValue: any;
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

export function _constructNumberArray(lower: number, upper: number) {
    var arr: number[] = [];
    for (var i = lower; i <= upper; i++) {
        arr.push(i)
    }
    return arr;
    // return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
}

export function constructBlockArray() {
    return _constructNumberArray(Tstart, nTrialsPerBlock)
    // return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50];
}

export function constructTargetArray() {
    return _constructNumberArray((Tstart - 1), (Tend - 1))
    // return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
}

export function constructPracticeArray() {
    return _constructNumberArray(Pstart, nPracticeTrials)
    // return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
}

function constructStimName(prefix: string, imageNumber: number) {
    return prefix + imageNumber + '.' + imageExt;
}

export function constructImageName(imageType: string, imageNumber: number) {
    switch(imageType) {
        case 'D':
            return constructStimName(distractorPrefix, imageNumber);
        case 'C':
            return constructStimName(carPrefix, imageNumber);
        case 'F':
            return constructStimName(facePrefix, imageNumber);
        case 'HF':
            return constructStimName(highFacePrefix, imageNumber);
        case 'LF':
            return constructStimName(lowFacePrefix, imageNumber);
        case 'P':
            return constructStimName(practicePrefix, imageNumber);
    }
}

export function constructRandImageName(imageType: string) {
    switch(imageType) {
        case 'D':
            return constructImageName(distractorPrefix, randInt(Dstart, Dend));
        case 'C':
            return constructImageName(carPrefix, randInt(Tstart, Tend));
        case 'F':
            return constructImageName(facePrefix, randInt(Tstart, Tend));
        case 'HF':
            return constructImageName(highFacePrefix, randInt(Tstart, Tend));
        case 'LF':
            return constructImageName(lowFacePrefix, randInt(Tstart, Tend));
    }
}

export function generateDistractorArray(n: number) {
    var distractorNumbers: number[] = chooseNUniqueRandomWithinRange(n, Dstart, Dend);
    var distractorImageNumbers: string[] = [];
    for (var i = 0; i < distractorNumbers.length; i++){
        distractorImageNumbers.push(constructImageName(distractorPrefix, distractorNumbers[i]));
    }

    return distractorImageNumbers;
}

export function generatePracticeArray() {
    var practiceNumbers: number[] = chooseNUniqueRandomWithinRange((Pend - Pstart + 1), Pstart, Pend);
    var practiceImages: string[] = [];
    for (var i = 0; i < practiceNumbers.length; i++) {
        practiceImages.push(constructImageName(practicePrefix, practiceNumbers[i]));
    }
    
    return practiceImages;
}

export function insert(arr: string[], index: number, item: string) {
    arr.splice(index, 0, item);
    return arr;
}

export function insertAtRandom(arr: string[], item: string) {
    insert(arr, randInt(0, arr.length), item);
    return arr;
}

export function getCondCode(condition: string) {
    switch (condition) {
        case 'F':
            return 1;
        case 'C':
            return 2;
        case 'LF':
            return 3;
        case 'HF':
            return 4;
    }
    // should never get here
    return 0;
}

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

export function encodeTargetTypeHR(condition: string) {
    switch (condition) {
        case 'F':
            return 'face';
        case 'C':
            return 'car';
        case 'LF':
            return 'object that looks like a face';
        case 'HF':
            return 'object that looks like a face';
    }
    // should never get here
    return 0;
}
