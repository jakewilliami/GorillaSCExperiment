<h1 align="center">
    Experiments using Gorilla Experiment Builder
</h1>

<p align="center"><i>Developed by Lizzie Collyer and Jake Ireland, early Feb., 2021, using <a href="https://gorilla.sc/">Gorilla Experiment Builder's</a> code editor.</i></p>

---

<h2>Contents</h2>
<h3>A Simple Visual Search Tast</h3>
<h3>An Attentional Blink Task</h3>

---

## Policy Decision for the Visual Search Task

All images are in a `Stimuli` directory.  Distractors have names `D<num>.jpg`; Faces, `F<num>.jpg`; etc. (for `C`, `HF`, and `LF` as well).  This is an important step in the randomisation process, because instead of randomly pulling an image from the directory, we randomly pull a number from a list of numbers, and then add (for example) `D` to the start, and `.jpg` to the end (you can change the file extension by changing the line at the top of `utils.ts`).

Furthermore, we aim to keep this programme as flexible as possible.  That is, to change the number of targets in each trial you will need to change `tEnd` in `utils.ts` (similarly with the number of distractors).  To change the types of target images, you will need to change the lines defining the different prefixes at the top of `utils.ts`, and change the `stimConditions` variable at the top of `main.ts`, as well as, of course, uploading said target images given the naming convention (see above).  There are also a couple of functions within `utils.ts` one would have to change, should they add different conditions.  If you want to change the ratio of target-to-distractor trials in each block, simply change the `proportionOfDistractors` variable at the top of `utils.ts`, as we have done the maths to change everything else accordingly.

There are limitations to the flexibility of this programme, however.  Currently the programme is implemented to take different target blocks *given each block have the same number of target images*.  Though it is experimentally questionable to want blocks with different number of target images, to implement such a feature you would probably need to define a function which handles the array construction for different targets.  This could probably be an extension of `constructTargetArray` using a `switch`/`case` statement, and then you could need to change the appropriate function calls in `main.ts`

## A Note on `utils/`

#### `utils/` Contents

Please note that a lot of these scripts and programmes were written quickly for some quick automisations, and as such may need changing given the computer you are running this on, and your system.  It will use either `bash`, R 4.0, Python 3.8, or Julia 1.5, and may have programme dependencies.

  - `*.toml`:
    - Julia project files for `utils/` dependencies;
  - `assess_categories.jl`:
    - A Julia script to create a bar chart of frequencies of categories from the `data/distractor_categories.csv` data file (see also `utils/get_categories.jl` for generating said data file);
  - `get_categories.jl`:
    - Given a directory of distractor images (named by the "THINGS object concept and object image database"), we pull from data the "THINGS object concept and object image database" and give each distractor one of 27 categories as determined by top down processing, bottom up processing, and manually;
  - `get_image_sharpness.py`:
    - Given an image file as a command line argument, prints the [estimated sharpness](www.mathworks.com/matlabcentral/fileexchange/32397-sharpness-estimation-from-image-gradients/content/estimate_sharpness_test.m) as defined by the average gradient;
  - `get_rand_THINGS.jl`:
    - Given a list of images (already chosen distractors), get distractor images from the "THINGS object concept and object image database" which have not been chosen yet;
  - `getres.sh` [deprecated]:
    - Briefly used to get the screen resolution of the present computer;
  - `make_image_arr.py`:
    - The script that started it all.  Given images, it chooses 24, and potentially a target image, and puts them into an image grid;
  - `make_many.sh` [deprecated]:
    - A shell-based wrapper script for `make_image_arr.py`;
  - `make_practice.sh` [deprecated]:
    - Another wrapper script to make practice image arrays from the `make_image_arr.py` script;
  - `normalise_images.py`:
    - An attempt at acutance normalisation by using the method described in `get_image_sharpness.py` to normalise acutance across a list of images.
  - `parse_vec.R`:
    - An R script to take a vector from a string (as is one of the metrics recorded in our experiment) and process it as a vector in R.

#### More Notes

We have used SHINE toolbox, written in MATLAB, to standardise luminance of all images.  Simple tools such as bash, GIMP, and ImageMagick, to process images further (converting to certain formats, and cropping them, etc.).  Python has been used to get some sharpness metrics, and Julia to do some processing of files/randomisation.  Most (all?) distractors are taken from the [THINGS object concept and object image database](https://osf.io/jum2f/) dataset.

Some of these utilities were from prior to Gorilla work, where we considered pregenerating the arrays.  The main utility is `make_image_arr.py`, where we generate these image arrays.

Example:
```bash
$ python3 utils/make_image_arr.py # will generate an array of distractors

$ python3 utils/make_image_arr.py D # will generate an array of distractors

$ python3 utils/make_image_arr.py F # will generate an array of distractors with a face in a random position
```

If you need to change image size and padding between images, etc., there are lines at the top of the file you can change

Please ensure you have a `data` directory, with appropriate subdirectories (see below), and an `out` directory for the created images to go.
```bash
$ tree -L 2
.
├── LICENSE
├── README.md
├── data
│   ├── Cars
│   ├── Distractor
│   ├── Faces
│   ├── Highface\ pareidolia
│   └── Lowface\ pareidolia
├── out
│   ├── out.png
│   ├── out_resized.png
│   └── out_with_borders.png
├── src
│   ├── Style.less
│   ├── finish.hbs
│   ├── instructions.hbs
│   ├── main.ts
│   ├── trial.hbs
│   └── utils.ts
└── utils
    ├── getres.sh
    └── make_image_arr.py
```

## Notes on Gorilla's API

  - All main code is within a function parameter taken in by the function call `gorilla.ready`.  

  - Ensure you create any metrics called in `main.ts` in the <kbd>Metrics</kbd> tab or the Gorilla Code Editor.

  - We have used `gorilla/state_machine` to transition between trials, blocks, instructions, etc.  The main state machine call happens in the `gorilla.run` function.  When you add a state to the state machine, the function `addState` takes in two arguments: the state name you are adding, and a dictionary.  This dictionary consists of two keys: `onEnter` (whose value is a function which is executed every time the state is entered), and `onExit` (whose value is a function which is executed when the state is left).

  - You can pass a parameter to the state.  As far as I can tell, you can only pass a single parameter.  However, to overcome this you can create an `interface`.  The way you pass parameters to the `onEnter` part of a state is as follows:
    ```typescript
    SM.addState(State.MyState, {
        onEnter: (machine: stateMachine.Machine, someParameter: string) => {
            ...
        }
    })
    ```
    And then you call this in `transition`:
    ```typescript
    machine.transition(State.MyState, 'hello world')
    ```
    This works well `onEnter`, but as of time of writing (Feb., 2021), this functionality does not exist `onExit`.
    
    To see if you need to go to the next stage, usually I would want to check some condition `onExit` and proceed from there.  However, if this is condition needs to be passed as a parameter, by the note above, you cannot do this.  The workaround is to have this condition at the start of the `onEnter` block.  That is, instead of doing this:
    ```typescript
    SM.addState(State.MyState, {
        onEnter: (machine: stateMachine.Machine, someParameter: type) => {
            ... // code goes here
        },
        onExit: (machine: stateMachine.Machine, someParameter: type) => {
            if (someParameter.someCondition) {
                machine.transition(State.SomeOtherState)
            }
        }
    })
    ```
    You will have to do this:
    ```typescript
    SM.addState(State.MyState, {
        onEnter: (machine: stateMachine.Machine, someParameter: type) => {
            if (someParameter.someCondition) {
                machine.transition(State.SomeOtherState)
            } else {
                ... // code goes here
            }
        }
    })
    ```
    It's not nice, but it is the only workaround if the condition must exist in `someParameter`.  If you can make the condition global, then that would be a cleaner workaround.

## A Note on Method of Experiment Construction and Open Source

There were three ways to go about creating this experiment, and they are listed in order of portability as follows:
  - The [Gorilla Task Builder](https://gorilla.sc/support/reference/faq/task-builder);
  - Using [jsPsych](https://www.jspsych.org/);
  - "Pure" TypeScript.
  
We chose to do this the latter way.  This was perhaps a simple experiment in the Task Builder, but that would not be very portable at all, if we had to move to another experiment platform.  Using jsPsych would have perhaps been simpler, because of certain online discussions around a similar task ([[1]](https://github.com/jspsych/jsPsych/discussions/953), [[2]](https://github.com/mahiluthra/working_memory_tests), [[3]](https://www.jspsych.org/plugins/jspsych-vsl-grid-scene/)).  However, after writing a lot of bash scripts that need maintaining because APIs that I rely on are changing, we didn't want to have to rely on an API that might require this experiment to need maintenance (that said, there are some things this experiment relies within Gorilla that might change...).  (We also didn't really realise that you could so easily import jsPsych into the experiment builder.)  So, we ended up using "Pure" TypeScript.  I put "Pure" in quotation marks, because it *does* use some Gorilla API functionality which is not portable.  Namely, the state machine which we use to transition into each different part of the experiment, and the various interactions with Gorilla regarding stimuli URLs and jQuery calls to the API to display everything correctly.

We believe that this experiment is as flexible and portable as possible.  As such, we have made this code open-source (though the Gorilla API is not), so as to help anyone else who is trying to implement the visual search experiment in Gorilla, or some other experiment-hosting/-building platform.  Hopefully this helps someone.
