# Experiments' Source Code

There are two kinds of experiments:
  - Visual Search
  - Attentional Blink

This [`src/`](.) directory contains different iterations of these experiments, which in our case has particular interest in face perception, utilising [pareidolia](https://www.wikiwand.com/en/Pareidolia) images.  We have attempted to retrospecively document these versions in READMEs of each subdirectory.

## Visual Search
In visual search experiments, the participant is met with a grid of images and they have to identify whether a target image is present.  The number of images within the grid may vary.

In our case, the target image is either a face, pariedolia image, or flower.

## Attentional Blink
In attentional blink experiments, the participant is showed a sequence of images.  Within these images (at random&trade; positions), there will occur a target image.  The idea is that in some trials there is a second target image, but the participant's attention may be on the first target image and as such may miss the second.  The space between target one (T1) and two (T2) may vary.

In our case, there are 20 images shown in each sequence; the first target will be a watch, where the participant is to identify whether it is digital or analogue, and the second target, if present, must be one of possibly three different types of targets (face, pareidolia, flower).  In particular, we are interested in whether the attentional blink occurs where face-like objects (pareidolia) images are the second target.

