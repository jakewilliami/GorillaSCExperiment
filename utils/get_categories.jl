using CSV, DataFrames

const names_url = "https://files.osf.io/v1/resources/jum2f/providers/osfstorage/5d4c2bc722a88600165004f6?action=download&direct&version=2"
const bottom_up_url = "https://files.osf.io/v1/resources/jum2f/providers/osfstorage/5d4ebd7d0f488d0016909bfd?action=download&direct&version=1"
const top_down_url = "https://files.osf.io/v1/resources/jum2f/providers/osfstorage/5d4ebd8422a886001750ee0b?action=download&direct&version=1"
const manual_url = "https://files.osf.io/v1/resources/jum2f/providers/osfstorage/5d4ebd7e22a8860019504e43?action=download&direct&version=1"

load_tsv(file) = DataFrame(CSV.File(file, header = true, delim = '\t'))
download_tsv(url) = load_tsv(download(url))

function map_categories(df::DataFrame, object_names::Vector{String})
    mapped_categories = Dict()
    
    for (i, row) in enumerate(eachrow(df))
        positive_match = findfirst(x -> x == 1, row)
        category = isnothing(positive_match) ? "" : positive_match
        
        push!(mapped_categories, object_names[i] => string(category))
    end
    
    return mapped_categories
end

function get_files(dir::String)
    return collect(Base.Iterators.flatten([files for (_, _, files) in walkdir(dir)]))
end

function main(distractor_dir::String, out_file::String)
    object_names = download_tsv(names_url).uniqueID
    df_bottom_up = download_tsv(bottom_up_url)
    df_top_down = download_tsv(top_down_url)
    df_manual = download_tsv(manual_url)
    
    mapped_categories = Dict(
        "bottom up" => map_categories(df_bottom_up, object_names),
        "top_down" => map_categories(df_top_down, object_names),
        "manual" => map_categories(df_manual, object_names)
    )
    
    distractor_categories = DataFrame(file_names = [], bottom_up = [], top_down = [], manual = [])
    
    for distractor in get_files(distractor_dir)
        distractor == "." && continue
        distractor == ".DS_Store" && continue
        
        distractor_name = distractor[1:(end - 8)] # _[[:digit:]][[:digit:]].\.jpg
        
        temp_data = [distractor]
        for (map_type, mapped_dict) in mapped_categories
            distractor_category = mapped_dict[distractor_name]
            push!(temp_data, distractor_category)
        end
        
        push!(distractor_categories, temp_data)
    end
    
    CSV.write(out_file, distractor_categories)
    
    return distractor_categories
end

main("/Users/jakeireland/Desktop/New original/", "/Users/jakeireland/projects/GorillaSCExperiment/data/distractor_categories.csv")
