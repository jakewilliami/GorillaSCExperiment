from PIL import Image, ImageEnhance
import sys
import os

## This script takes in an image path, and an output directory.

im = Image.open(sys.argv[1])

enhancer = ImageEnhance.Sharpness(im)

factor = 2
im_s = enhancer.enhance(factor)
im_s.save("{}/{}".format(sys.argv[2], os.path.basename(sys.argv[1])));

