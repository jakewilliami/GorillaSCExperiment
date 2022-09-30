import {
    ExperimentConfigs,
    ImageType,
    ResponseKeyCode,
    ImageUtilsConfigs,
    NumRange
} from './types';

// define proportion of distractors (i.e., 33% of trials)
// are distractor arrays, so proportion is 0.33
const proportionOfDistractors: number = 1 / 3;
// ibid. for practice trials
const proportionOfPracticeDistractors = 0.5;

// define where numbered distractors start and end
const distractorRange: NumRange = {
    start: 1, 
    end: 400
};
// define where numbered targets (per block) start and end
const targetRange: NumRange = {
    start: 1,
    end: 25
};
// define how many practice trials you have
const practiceRange: NumRange = {
    start: 1,
    end: 6
};

// Image prefixes; for example, face images may be of the form 'F32.png'
const imagePrefixes = new Object();
imagePrefixes[ImageType.Distractor] = 'D';
imagePrefixes[ImageType.Car] = 'C';
imagePrefixes[ImageType.Face] = 'F';
imagePrefixes[ImageType.Pareidolia] = 'P';
imagePrefixes[ImageType.Bird] = 'Bird';
imagePrefixes[ImageType.Flower] = 'Flower';
imagePrefixes[ImageType.Watch] = 'W';

// Main image utils configs struct
const imageUtilsConfigs: ImageUtilsConfigs = {
    // Distractors
    proportionOfDistractors: proportionOfDistractors,
    proportionOfTargets: 1 - proportionOfDistractors,

    // Image trials
    proportionOfPracticeDistractors: proportionOfPracticeDistractors,
    proportionOfPracticeTargets: 1 - proportionOfPracticeDistractors,

    // Image ranges
    distractorRange: distractorRange,
    targetRange: targetRange,
    practiceRange: practiceRange,

    // Other image configuration
    imagePrefixes: imagePrefixes,
    imgExt: 'png',
    exampleImageSize: '20vh',  // 20% of the view height of the browser

    // Other numbers
    moduloVal: Math.floor(1 / proportionOfDistractors),
    numberOfTrialImages: targetRange.end - targetRange.end + 1,
    nTrialsPerBlock: Math.floor((targetRange.end - targetRange.end + 1) / (1 - proportionOfDistractors)),
    practiceModuloVal: Math.floor(1 / proportionOfPracticeDistractors),
    numberOfPracticeImages: practiceRange.end - practiceRange.start + 1,
    nPracticeTrials: Math.floor((practiceRange.end - practiceRange.start + 1) / (1 - proportionOfPracticeDistractors)),
};

// Main experiment configs struct
export const exprConfigs: ExperimentConfigs = {
    // Trial/block size definitions
    nT2ImagesPerBlock: 50,
    nImagesInSequence: 20,
    nDistractors: 500,
    nBlocks: 3,
    nPracticeT2Images: 6,

    // Display timing (in milliseconds)
    beforeFixationDelay: 500,
    fixationLength: 500,
    afterFixationDelay: 0,
    imageDisplayLength: 70,
    practiceFeedbackMessageLength: 800,

    // Experiment-specific settings
    T1Types: [ImageType.Face, ImageType.Pareidolia, ImageType.Watch],
    lagPositions: [3, 7],
    responseKeys: [ResponseKeyCode.Absent, ResponseKeyCode.Present],

    // User interface information
    imageLoadingMessage: 'Please wait while the experiment is loading.  This may take some time.',
    consentFilename: 'AB_consent.pdf',
    debriefFilename: 'AB_debrief',

    // utils.ts information
    imageUtilsConfigs: imageUtilsConfigs,
};
