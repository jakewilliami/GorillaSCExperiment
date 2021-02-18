function get_files(dir::String)
    return collect(Base.Iterators.flatten([files for (_, _, files) in walkdir(dir)]))
end

function get_root_and_files(dir::AbstractString)
    allfiles = Matrix{Int}(undef, 0, 2)

    allfilesraw = [(root, files) for (root, _, files) in walkdir(dir)]

    for (objectdir, objects) in allfilesraw
        for object in objects
            allfiles = cat(allfiles, [objectdir object], dims = 1)
        end
    end
    
    return allfiles
end

function main()
    # selected_images = []
    # selected_images = get_files("/Users/jakeireland/projects/GorillaSCExperiment/data/chosen_object_images_1/")
    selected_images = vcat(get_files("/Users/jakeireland/projects/GorillaSCExperiment/data/chosen_object_images_1/"), get_files("/Users/jakeireland/projects/GorillaSCExperiment/data/chosen_object_images_2/"), get_files("/Users/jakeireland/projects/GorillaSCExperiment/data/chosen_object_images_3/"))
    allfiles = get_root_and_files("/Users/jakeireland/projects/GorillaSCExperiment/data/THINGS/")

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
                cp(joinpath(randimageinfo[1], randimage), joinpath("/Users/jakeireland/projects/GorillaSCExperiment/data/chosen_object_images_4", randimage))
            end
        end
    end
    
    return nothing
end

main()
