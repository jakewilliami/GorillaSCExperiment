/*
This utils.ts file exports the following helper functions:
  - randInt(lower, upper)
    - Generates a random integer (whole, natural number) between lower and upper numbers
  - randVal(arr)
    - Pulls a random value from the given array
  - chooseNUniqueRandomWithinRange(n, lower, upper)
    - Chooses n many unique random numbers between lower and upper bounds
  - constructImageName(imageType, imageNumber)
    - constructs the image file name given the imageType and the imageNumber.  ImageType can be one of:
      - "D" or "Distractor"
      - "C" or "Car"
      - "F" or "Face"
      - "HF" or "HighFace"
      - "LF" or "LowFace"
  - constructRandImageName(imageType)
    - constructs the image name of a random number within the given image type.  ImageType can be one of:
      - "D" or "Distractor"
      - "C" or "Car"
      - "F" or "Face"
      - "HF" or "HighFace"
      - "LF" or "LowFace"
  - generateDistractorArray(n)
    - Generates an array of n many distractor names
  - insert(array, index, item)
    - Inserts item into array at specified index
*/

// define where numbered distractors start and end
const Dstart: number = 1;
const Dend: number = 49;
// define where numbered targets start and end
const Tstart: number = 1;
const Tend: number = 25;

// define distractor and target prefix
const distractorPrefix: string = 'D';
const carPrefix: string = 'C';
const facePrefix: string = 'F';
const highFacePrefix: string = 'HF';
const lowFacePrefix: string = 'LF';

// define file extension
const imageExt: string = 'jpg';

export function randInt(lower: number, upper: number) {
    return Math.floor(Math.random() * upper - lower + 1) + lower;
}

export function randVal(arr: any[]) {
    const randomIndex: number = randInt(0, arr.length - 1);
    return arr[randomIndex];
}

export function takeRand(arr: any[]) {
    const randInd: number = randInt(0, arr.length - 1);
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

export function constructBlockArray() {
    var arr: number[] = [];
    for (var i = 1; i < 51; i++) {
        arr.push(i);
    }
    return arr;
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

export function insert(arr: string[], index: number, item: string) {
    return arr.splice(index, 0, item);
}

export function insertAtRandom(arr: string[], item: string) {
    return insert(arr, randInt(0, arr.length), item);
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
