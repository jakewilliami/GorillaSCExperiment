from PIL import Image # this is used to create the images
import os # this is for reading paths
from glob import glob
from pathlib import Path # as above
import random # this is used to choose 25 unique random images
from math import ceil, floor

# data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), "data")
# data_dir = os.path.join(os.path.dirname(os.path.realpath(os.path.dirname(os.path.realpath(__file__)))), "data")
data_dir = os.path.join(Path(os.path.realpath(__file__)).parents[1], "data")

print(data_dir)

# distractors = [os.path.abspath(i) for i in os.listdir(os.path.join(data_dir, "Distractor"))] # this is where you need to put your path to directory
distractors glob.glob(os.path.join(data_dir, "Distractor"))
print(distractors)
cars = [os.path.abspath(i) for i in os.listdir(os.path.join(data_dir, "Cars"))]
faces = [os.path.abspath(i) for i in os.listdir(os.path.join(data_dir, "Faces"))]
hf_pareidolia = [os.path.abspath(i) for i in os.listdir(os.path.join(data_dir, "Highface pareidolia"))]
lf_pareidolia = [os.path.abspath(i) for i in os.listdir(os.path.join(data_dir, "Lowface pareidolia"))]

randtarget = random.choice(cars + faces + hf_pareidolia + lf_pareidolia)
listofimages = random.sample(distractors, 24)
listofimages.append(randtarget)
listofimages = random.sample(listofimages, len(listofimages))

print(listofimages)

def create_collage_with_outer_borders(cols, rows, img_width, img_height, padding, listofimages):
    width = (img_width * cols) + (padding * (cols - 1))
    height = (img_height * rows) + (padding * (rows - 1))
    width_without_padding = width - padding
    height_without_padding = height - padding
    cell_width = width_without_padding//cols
    cell_height = height_without_padding//rows
    thumbnail_width = cell_width - padding
    thumbnail_height = cell_height - padding
    size = thumbnail_width, thumbnail_height
    new_im = Image.new('RGBA', (width, height))
    ims = []
    for p in listofimages:
        im = Image.open(p)
        im.thumbnail(size)
        ims.append(im)
    i = 0
    x = 0
    y = 0
    for col in range(cols):
        for row in range(rows):
            new_im.paste(ims[i], (x + padding, y + padding))
            i += 1
            x += cell_width
        y += cell_height
        x = 0

    return new_im

def create_collage(images_per_row, img_width, img_height, padding, images):
    frame_width = (img_width * images_per_row) + (padding * (images_per_row - 1))
    cell_width = ceil((frame_width + padding) / images_per_row)
    new_image_width = cell_width - padding
    scaling_factor = new_image_width / img_width

    scaled_img_width = ceil(img_width * scaling_factor)
    scaled_img_height = ceil(img_height * scaling_factor)

    cell_height = scaled_img_height + padding

    number_of_rows = ceil(len(images) / images_per_row)
    frame_height = cell_height * number_of_rows - padding

    new_im = Image.new('RGBA', (frame_width, frame_height))

    x_cord = 0
    for num, im in enumerate(images):
        if num % images_per_row == 0:
            x_cord = 0
        im = Image.open(im)
        im.thumbnail((scaled_img_width, scaled_img_height))
        y_cord = (num // images_per_row) * cell_height
        new_im.paste(im, (x_cord, y_cord))
        x_cord += cell_width

    return new_im

def create_collage_resize(images_per_row, img_width, img_height, desired_frame_width, desired_frame_height, padding, images):
    im = create_collage(images_per_row, img_width, img_height, padding, images)
    return im.resize((desired_frame_width, desired_frame_height))

img_width, img_height = Image.open(listofimages[0]).size # get size of images (assume all same size)

# ---------------------------------
# CHANGE THIS SECTION
# ---------------------------------

padding = 5
arr_height, arr_width = (530, 530)
nrows, ncols = (5, 5)

# ---------------------------------

wo_borders = create_collage_with_outer_borders(nrows, ncols, img_width, img_height, padding, listofimages)
img = create_collage(nrows, img_width, img_height, padding, listofimages)
img_resized = create_collage_resize(nrows, img_width, img_height, arr_height, arr_width, padding, listofimages)

# using PNG because JPEG is lossy
wo_borders.save(os.path.join("out", "out_with_borders.png"), "PNG", quality = 80, optimize = True, progressive = True)
img.save(os.path.join("out", "out.png"), "PNG", quality = 80, optimize = True, progressive = True)
img_resized.save(os.path.join("out", "out_resized.png"), "PNG", quality = 80, optimize = True, progressive = True)
