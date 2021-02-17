selected_images = []
allfiles = Matrix{Int}(undef, 0, 2)

allfilesraw = [(root, files) for (root, _, files) in walkdir(".")]

for (objectdir, objects) in allfilesraw
    for object in objects
        allfiles = cat(allfiles, [objectdir object], dims = 1)
    end
end

i = 0
while i < 800
    randimageindex = rand(1:size(allfiles, 1))
    randimageinfo = allfiles[randimageindex, :]
    randimage = randimageinfo[2];
    if match(r"\.jpg", randimage).match != ""
        if randimage ∉ selected_images
            i += 1
            push!(selected_images, randimage)
            cp(joinpath(randimageinfo[1], randimage), joinpath("chosen_object_images", randimage))
        end
    end
end
