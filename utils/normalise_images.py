from PIL import Image, ImageEnhance
import numpy as np
import sys
import os
import pathlib


def get_sharpness(imfile):
	im = Image.open(imfile).convert('L') # to grayscale
	array = np.asarray(im, dtype=np.int32)
	gy, gx = np.gradient(array)
	gnorm = np.sqrt(gx**2 + gy**2)
	sharpness = np.average(gnorm)
	return sharpness

def enhance_sharpness(imfile, sharpness_factor):
    im = Image.open(imfile)
    enhancer = ImageEnhance.Sharpness(im)
    im_s = enhancer.enhance(sharpness_factor)
    return im_s

def normalise_sharpnesses(imdir, out_dir, desired_sharpness):
	for imfile in [os.path.abspath(os.path.join(os.path.dirname(imdir), i)) for i in os.listdir(os.path.abspath(imdir))]:
		sharpness_factor = desired_sharpness / get_sharpness(imfile)
		print("Image sharpness is {}, so we need to enhance by factor of {}".format(get_sharpness(imfile), sharpness_factor))
		im_s = enhance_sharpness(imfile, sharpness_factor)
		im_s.save("{}/{}".format(out_dir, os.path.basename(imfile)))


# normalise_sharpnesses(sys.argv[1], sys.argv[2], int(sys.argv[3]))
# normalise_sharpnesses('/Users/jakeireland/Downloads/SHINED both whole image and foreground/', '/Users/jakeireland/Desktop/out/', 20)
normalise_sharpnesses('/Users/jakeireland/Desktop/sharpened/', '/Users/jakeireland/Desktop/normalised/', 20)
