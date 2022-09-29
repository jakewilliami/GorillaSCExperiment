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
    None = '',
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
    t1Image: ImageStruct,
    t2Image: ImageStruct,
}

export interface NumRange {
    start: number,
    end: number,
}
