using CSV, DataFrames, StatsPlots, StatsBase

categories = String[
    "food", "animal", "clothing", "tool", "sports equipment", "vegetable", "vehicle", "musical instrument",
    "fruit", "body part", "dessert", "toy", "container", "part of car", "weapon", "bird", "furniture",
    "kitchen tool", "office supply", "clothing accessory", "kitchen appliance", "plant", "insect",
    "home décor", "medical equipment", "electronic device", "drink"
]

function parse_categories(datafile::String)
    df = DataFrame(CSV.File(datafile, header = true))
    
    # check that all categories are defined
    for i in skipmissing(df.top_down)
        if i ∉ categories
            error("There is no category called \"$(i)\".")
        end
    end
    
    frequencies = countmap(skipmissing(df.category))
    
    theme(:solarized)
    
    plt = bar(
        categories,
        Int[get(frequencies, c, 0) for c in categories],
        legend = false,
        xticks = (0.5:length(categories), categories),
        xrotation = 45,
        fontfamily = font("Times"),
        xlabel = "Object Category",
        ylabel = "Frequency",
        title = "Frequency of Object Categories in chosen ~200 Distractors"
    )
    
    # plt = bar(
    #     collect(keys(frequencies)),
    #     collect(values(frequencies));
    #     legend = false,
    #     xticks = (0.5:length(keys(frequencies)), collect(keys(frequencies))),
    #     xrotation = 45,
    #     fontfamily = font("Times"),
    #     xlabel = "Category",
    #     ylabel = "Frequency",
    #     title = "Frequency of Categories in chosen 200 Distractors"
    # )
    
    savefig(plt, "/Users/jakeireland/Desktop/categories.pdf")
end

parse_categories("/Users/jakeireland/projects/GorillaSCExperiment/data/distractor_categories.csv")
