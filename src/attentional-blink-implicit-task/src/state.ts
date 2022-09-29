import {
    ExperimentConfigs,
    ImageType,
    ImageStruct,
    ImageUtilsConfigs,
} from 'types';

// This is one of our main classes that we use to keep 
// track of experiment information globally.
class GlobalExperimentState {
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

    // All image info
    t1Images: ImageStruct[];
    t2Images: ImageStruct[];
    
    // Image URLs
    allFaceURLs: string[];
    allPareidoliaURLs: string[];
    allObjectURLs: string[];
    allWatchURLs: string[];

    // utils.ts information
    imageUtilsConfigs: ImageUtilsConfigs;

    // Main constructor from ExperimentConfigs
    public constructor(exprConfigs: ExperimentConfigs) {
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

        // ALl image info
        this.t1Images = [];
        this.t2Images = [];

        // Image URLs
        this.allFaceURLs = [];
        this.allPareidoliaURLs = [];
        this.allObjectURLs = [];
        this.allWatchURLs = [];

        // Relative trial/block size calculations
        this.nTrials = this.nT2ImagesPerBlock * 3 * 2; // T2 images per block * 3 blocks * 2 trial types
        this.nT1ImagesPerBlock = this.nT2ImagesPerBlock * 2; // T2 images per block * 2 trial types
        this.nPracticeT1Images = this.nPracticeT2Images * 2; // Half of all practice trials have no T2
        this.nPracticeT1ImagesPerT1Type = Math.floor(this.nPracticeT1Images / exprConfigs.T1Types.length);

        // Image/utils configuration
        this.imageUtilsConfigs = exprConfigs.imageUtilsConfigs;
    }
}
