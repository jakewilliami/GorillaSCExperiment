import {
    ImageStruct,
    ResponseKeyCode, 
    BlockStruct,
    TargetCondition,
    GlobalExperimentState,
    State,
} from 'types';

export function responseIsAllowed(respCode: number) {
    // return Object.values(ResponseKeyCode).includes(respCode);  // Requires ECMAScript 2017, so we can't use it
    const respAllowedValues: string[] = Object.keys(ResponseKeyCode).filter((item) => {
        return !isNaN(Number(item));
    });
    // Filter ResponseKeyCode values from Object.keys(ResponseKeyCode) and return them as numbers
    // Must check each element because `respAllowedValues.includes(respCode.toString())` was erroring
    const respCodeStr: string = respCode.toString()
    for (let i = 0; i < respAllowedValues.length; i++) {
        if (respCodeStr == respAllowedValues[i]) {
            return true;
        }
    }
    return false;
}

export function responseIsCorrect(blockStruct: BlockStruct, respCode: number) {
    const k: ResponseKeyCode = respCode;
    return ((blockStruct.t2Condition == TargetCondition.Present && k === ResponseKeyCode.Present) || 
            (blockStruct.t2Condition == TargetCondition.Absent && k === ResponseKeyCode.Absent))
}

// Given the current BlockStruct and necessary global experiment information as a GlobalExperimentState, 
// returns the next state for the state machine
export function nextState(blockStruct: BlockStruct, exprState: GlobalExperimentState) {
    if (blockStruct.t1TargetsArray.length === 0 && blockStruct.t2DisplayGapOptions.length === 0 && blockStruct.t2TargetsArray.length === 0) {
        /// then our block is over
        if (exprState.allFaceURLs.length === 0 && exprState.allObjectURLs.length === 0 && exprState.allPareidoliaURLs.length === 0) {
            // if there are no other blocks remaining, finish
            return [State.Debrief,];
        } else {
            // otherwise, initialise another block
            return [State.BlockInitialiser,];
        }
    } else {
        // if our trial is not over yet
        if (blockStruct.trialCounter == exprState.nT2ImagesPerBlock) { // either go to a break screen
            return [State.InterBlockBreak, blockStruct];
        } else { // or continue
            return [State.PreTrial, blockStruct];
        }
    }
}

export function nextPracticeState(blockStruct: BlockStruct) {
    if (blockStruct.t1TargetsArray.length === 0 && blockStruct.t2DisplayGapOptions.length === 0 && blockStruct.t2TargetsArray.length === 0) {
        /// then our block is over
        return [State.PostPracticeBreak,]
    } else {
        // if our trial is not over yet
        return [State.PracticePreTrial, blockStruct]
    }
}

export function getImageURLs(images: ImageStruct[]) {
    const URLs: string[] = [];
    for (let i = 0; i < images.length; i++) {
        URLs.push(images[i].url);
    }
    return URLs;
}
