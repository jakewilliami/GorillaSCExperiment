function main()
    selected_images = collect(Base.Iterators.flatten([files for (_, _, files) in walkdir("/Users/jakeireland/projects/GorillaSCExperiment/data/chosen_object_images_1/")]))
    allfiles = Matrix{Int}(undef, 0, 2)

    allfilesraw = [(root, files) for (root, _, files) in walkdir("/Users/jakeireland/projects/GorillaSCExperiment/data/THINGS/")]

    for (objectdir, objects) in allfilesraw
        for object in objects
            allfiles = cat(allfiles, [objectdir object], dims = 1)
        end
    end

    i = 0
    while i < 200
        randimageindex = rand(1:size(allfiles, 1))
        randimageinfo = allfiles[randimageindex, :]
        randimage = randimageinfo[2];
        # println(randimageinfo)
        if match(r"\.jpg", randimage).match != ""
            if randimage ∉ selected_images
                # println("passed")
                i += 1
                push!(selected_images, randimage)
                cp(joinpath(randimageinfo[1], randimage), joinpath("/Users/jakeireland/projects/GorillaSCExperiment/data/chosen_object_images_2", randimage))
            end
        end
    end
end

main()
