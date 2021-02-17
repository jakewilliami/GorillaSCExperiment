#! /usr/local/bin/Rscript

library(pacman)

pacman::p_load(stringr)

str_vec <- '["D19.jpg", "D2.jpg", "F24.jpg", "D9.jpg"]'

parse_vec <- function(v) {
    str_remove_all(v, regex('\\[|\\]|\\"')) %>% str_split(", ")
}

print(parse_vec(str_vec))


