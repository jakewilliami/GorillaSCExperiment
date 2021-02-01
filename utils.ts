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
    return Math.floor(Math.random() * upper) + lower;
}

export function randVal(arr: any[]) {
    const randomIndex: number = randInt(0, arr.length - 1);
    return arr[randomIndex];
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

function constructStimName(prefix: string, imageNumber: number) {
    return prefix + imageNumber + '.' + imageExt;
}

export function constructImageName(imageType: string, imageNumber: number) {
    switch(imageType) {
        case 'D':
        case 'Distractor':
        case 'distractor':
            return constructStimName(distractorPrefix, imageNumber);
        case 'C':
        case 'Car':
        case 'car':
            return constructStimName(carPrefix, imageNumber);
        case 'F':
        case 'Face':
        case 'face':
            return constructStimName(facePrefix, imageNumber);
        case 'HF':
        case 'HighFace':
        case 'highface':
        case 'highFace':
            return constructStimName(highFacePrefix, imageNumber);
        case 'LF':
        case 'LowFace':
        case 'lowface':
        case 'lowFace':
            return constructStimName(lowFacePrefix, imageNumber);
    }
}

export function constructRandImageName(imageType: string) {
    switch(imageType) {
        case 'D':
        case 'Distractor':
        case 'distractor':
            return constructImageName(distractorPrefix, randInt(Dstart, Dend));
        case 'C':
        case 'Car':
        case 'car':
            return constructImageName(carPrefix, randInt(Tstart, Tend));
        case 'F':
        case 'Face':
        case 'face':
            return constructImageName(facePrefix, randInt(Tstart, Tend));
        case 'HF':
        case 'HighFace':
        case 'highface':
        case 'highFace':
            return constructImageName(highFacePrefix, randInt(Tstart, Tend));
        case 'LF':
        case 'LowFace':
        case 'lowface':
        case 'lowFace':
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
