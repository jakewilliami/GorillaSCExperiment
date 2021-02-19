using CSV, DataFrames

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
    old_df = DataFrame(CSV.File("/Users/jakeireland/projects/GorillaSCExperiment/data/distractor_categories.csv", header = true))
    new_files = get_files("/Users/jakeireland/Desktop/New original/")
    new_df = DataFrame(filename = [], category = [], maybe = [])
    old_files = old_df.filename
    
    for distractor in new_files
        if distractor ∉ old_files
    end
end

# main()
