// This is one of our main classes that we use to keep 
// track of experiment information globally.
export class GlobalExperimentState {
    // Trial/block size definitions
    nT2ImagesPerBlock: number;
    nImagesInSequence: number;
    nDistractors: number;
    nBlocks: number;
    nPracticeT2Images: number;
    nTrials: number;
    nT1ImagesPerBlock: number;
    nPracticeT1Images: number;
    nPracticeT1ImagesPerT1Type: number;

    // Display timing (in milliseconds)
    beforeFixationDelay: number;
    fixationLength: number;
    afterFixationDelay: number;
    imageDisplayLength: number;
    practiceFeedbackMessageLength: number;

    // Experiment-specific settings
    T1Types: ImageType[];
    lagPositions: number[];

    // Image configuration
    imgExt: string;
    exampleImageSize: string;

    // User interface settings
    imageLoadingMessage: string;
    consentFilename: string;
    debriefFilename: string;

    // Image URLs
    allFaceURLs: string[];
    allPareidoliaURLs: string[];
    allObjectURLs: string[];
    allWatchURLs: string[];

    // utils.ts information
    imageUtilsConfigs: ImageUtilsConfigs;

    // Main constructor from ExperimentConfigs
    constructor(exprConfigs: ExperimentConfigs) {
        // Trial/block size definitions
        this.nT2ImagesPerBlock = exprConfigs.nT2ImagesPerBlock;
        this.nImagesInSequence = exprConfigs.nImagesInSequence;
        this.nDistractors = exprConfigs.nDistractors;
        this.nBlocks = exprConfigs.nBlocks;
        this.nPracticeT2Images = exprConfigs.nPracticeT2Images;

        // Display timing (in milliseconds)
        this.beforeFixationDelay = exprConfigs.beforeFixationDelay;
        this.fixationLength = exprConfigs.fixationLength;
        this.afterFixationDelay = exprConfigs.afterFixationDelay;
        this.imageDisplayLength = exprConfigs.imageDisplayLength;
        this.practiceFeedbackMessageLength = exprConfigs.practiceFeedbackMessageLength;

        // Experiment-specific settings
        this.T1Types = exprConfigs.T1Types;
        this.lagPositions = exprConfigs.lagPositions;

        // User interface settings
        this.imageLoadingMessage = exprConfigs.imageLoadingMessage;
        this.consentFilename = exprConfigs.consentFilename;
        this.debriefFilename = exprConfigs.debriefFilename;

        // Image URLs
        this.allFaceURLs = [];
        this.allPareidoliaURLs = [];
        this.allObjectURLs = [];
        this.allWatchURLs = [];

        // Relative trial/block size calculations
        this.nTrials = this.nT2ImagesPerBlock * 3 * 2; // 100 T2 images per block * 3 blocks * 2 trial types = 600
        this.nT1ImagesPerBlock = this.nT2ImagesPerBlock * 2; // 100 T2 images per block * 2 trial types = 200
        this.nPracticeT1Images = this.nPracticeT2Images * 2; // Half of all practice trials have no T2
        this.nPracticeT1ImagesPerT1Type = Math.floor(this.nPracticeT1Images / exprConfigs.T1Types.length);

        // Image/utils configuration
        this.imageUtilsConfigs = exprConfigs.imageUtilsConfigs;
    }
}

export interface ExperimentConfigs {
    // Trial/block size definitions
    nT2ImagesPerBlock: number,
    nImagesInSequence: number,
    nDistractors: number,
    nBlocks: number,
    nPracticeT2Images: number,

    // Display timing (in milliseconds)
    beforeFixationDelay: number,
    fixationLength: number,
    afterFixationDelay: number,
    imageDisplayLength: number,
    practiceFeedbackMessageLength: number,

    // Experiment-specific settings
    T1Types: ImageType[],
    lagPositions: number[],
    responseKeys: ResponseKeyCode[]

    // User interface settings
    imageLoadingMessage: string,
    consentFilename: string,
    debriefFilename: string,

    // Image/utils.ts information
    imageUtilsConfigs: ImageUtilsConfigs,
}

export interface ImageUtilsConfigs {
    // Distractors
    proportionOfDistractors: number,
    proportionOfTargets: number,

    // Image trials
    proportionOfPracticeDistractors: number,
    proportionOfPracticeTargets: number,

    // Image ranges
    distractorRange: NumRange,
    targetRange: NumRange,
    practiceRange: NumRange,

    // Other image configuration
    imagePrefixes,
    imgExt: string,
    exampleImageSize: string,

    // Other numbers
    moduloVal: number,
    numberOfTrialImages: number,
    nTrialsPerBlock: number,
    practiceModuloVal: number,
    numberOfPracticeImages: number,
    nPracticeTrials: number,
}

// https://en.wikipedia.org/wiki/List_of_Unicode_characters#Latin_script
export enum ResponseKeyCode {
    Present = 107, // Character code for 'k'
    Absent = 108,  // Character code for 'l'
}

export enum ImageType {
    Distractor = 'distractor',
    Face = 'face',
    Pareidolia = 'pareidolia',
    Bird = 'bird',
    Flower = 'flower',
    Watch = 'watch',
    Car = 'car',
}

export interface ImageStruct {
    url: string,
    name: string,
    type: ImageType,
}

// possible states in state machine
export enum State {
    // Starting states
    PreloadArrays,
    PreloadStimuli,
    Consent,
    RequestFullscreen,
    Demographics,
    Instructions,
    // Practice states
    PracticeInstructions,
    PracticeBlockInitialiser,
    PracticeBlock,
    PracticeInterBlockBreak,
    PracticePreTrial,
    PracticeFixationCross,
    PracticeTrial,
    PracticeT2SeenResponse,
    PostPracticeBreak,
    // Main experiment states
    BlockInitialiser,
    Block,
    InterBlockBreak,
    PreTrial,
    FixationCross,
    Trial,
    T2SeenResponse,
    // Finishish states
    Debrief,
    Finish,
}

// export interface TrialStruct {
//  t2ResponseKey: String,
//  t2ResponseTime: number,
//  t1ConditionType: string,
//  t2Present: boolean,
//  t2ResponseCorrect: boolean,
// }

export enum TargetCondition {
    None = '',
    Present = 'Present',
    Absent = 'Absent'
}

export interface PracticeTrialStruct {
    practiceT1Images: string[],
    practiceT2Images: string[],
}

export interface TrialStruct {
    t1ConditionType: string,
}

export interface BlockStruct {
    trialCounter: number,
    t1TargetsArray: ImageStruct[],
    t2DisplayPotentialArray: number[],
    t2DisplayGapOptions: number[],
    t2TargetsArray: ImageStruct[],
    trialArrayURLs: string[],
    t2PosGap: number,
    t2Condition: TargetCondition,
    thisTrialStruct: TrialStruct,
    t1Image: string,
    t2Image: string,
}

export interface NumRange {
    start: number,
    end: number,
}
