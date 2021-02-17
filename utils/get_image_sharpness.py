from PIL import Image
import numpy as np
import sys

im = Image.open(sys.argv[1]).convert('L') # to grayscale
array = np.asarray(im, dtype=np.int32)

gy, gx = np.gradient(array)
gnorm = np.sqrt(gx**2 + gy**2)
sharpness = np.average(gnorm)

# Sharpness is just the average constrast gradient
print(sharpness)
